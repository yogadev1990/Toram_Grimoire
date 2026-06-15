import http from 'http'
import Papa from 'papaparse'
import { DatasStoreBase } from '@/stores/app/datas/DatasStoreBase'
import { I18nStore } from '@/stores/app/locale/I18nStore'
import CharacterSystem from '@/lib/Character'
import EnchantSystem from '@/lib/Enchant'
import { LoadStats } from '@/stores/app/datas/utils/LoadStats'
import { LoadEnchant } from '@/stores/app/datas/utils/LoadEnchant'
import { EnchantDoll } from '@/lib/Enchant/EnchantDoll'
import { EnchantEquipmentTypes, EnchantStat } from '@/lib/Enchant/Enchant'
import Grimoire from '@/shared/Grimoire'

const STATS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS_XhF85gZ5sd9AtOMSM6JY4OuQwFlD6kToQynQ4bMq_fiaUNr26c7dbrIs6WeWnscKe1rau1npWYe7/pub?gid=616452461&single=true&output=csv&range=A:F'
const STATS_EN_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS_XhF85gZ5sd9AtOMSM6JY4OuQwFlD6kToQynQ4bMq_fiaUNr26c7dbrIs6WeWnscKe1rau1npWYe7/pub?gid=1353062937&single=true&output=csv&range=B:C'
const ENCHANT_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ4beI9I-sFoTgbTaKeMHRVo3xNm3gc5nQ-MWb9u7dlzRk0QmnMoJwcaR0815IqP0t-9-htpS8mUdQ1/pub?gid=0&single=true&output=csv&range=A:O'

// Mock i18n
I18nStore.i18n = {
  t: (key: string) => key
} as any

async function fetchCsv(url: string): Promise<string[][]> {
  const res = await fetch(url)
  const text = await res.text()
  return Papa.parse(text).data as string[][]
}

async function initDatabase() {
  console.log('Initializing database...')
  console.log('Fetching Stats CSV...')
  const statsData = await fetchCsv(STATS_CSV_URL)
  console.log('Fetching Stats EN Translation CSV...')
  const statsEnData = await fetchCsv(STATS_EN_CSV_URL)
  console.log('Fetching Enchant CSV...')
  const enchantData = await fetchCsv(ENCHANT_CSV_URL)

  DatasStoreBase.Character = new CharacterSystem()
  DatasStoreBase.Enchant = new EnchantSystem()

  console.log('Loading Stats...')
  LoadStats(DatasStoreBase.Character, {
    baseData: statsData,
    primaryLocaleData: statsEnData,
    secondaryLocaleData: null
  })

  console.log('Loading Enchant...')
  LoadEnchant(DatasStoreBase.Enchant, enchantData)
  console.log('Database initialized successfully!')
}

const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }

  if (req.url === '/calculate' && req.method === 'POST') {
    let body = ''
    req.on('data', chunk => {
      body += chunk
    })
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body)
        const doll = new EnchantDoll()

        // 1. Setup Equipment
        const eq = doll.build.equipment
        const typeId = payload.equipmentType // 0 = main weapon, 1 = body armor, 2 = main weapon (original element)
        if (typeId === 0) {
          eq.fieldType = EnchantEquipmentTypes.MainWeapon
          eq.isOriginalElement = false
        } else if (typeId === 1) {
          eq.fieldType = EnchantEquipmentTypes.BodyArmor
          eq.isOriginalElement = false
        } else if (typeId === 2) {
          eq.fieldType = EnchantEquipmentTypes.MainWeapon
          eq.isOriginalElement = true
        }
        eq.originalPotential = payload.originalPotential || 90
        const autoFindPotentialMinimum = !!payload.autoFindPotentialMinimum

        const mapType = (t: any) => {
          if (t === 0 || t === 'constant') return 'constant'
          if (t === 1 || t === 'multiplier') return 'multiplier'
          return t
        }

        // 2. Setup Positive Stats
        doll.positiveStats.length = 0 // Clear if any
        if (Array.isArray(payload.positiveStats)) {
          payload.positiveStats.forEach((s: any) => {
            const statBase = Grimoire.Character.findStatBase(s.baseId)
            if (!statBase) return
            const origin = Grimoire.Enchant.findEnchantItem(statBase)
            if (!origin) return
            const mappedType = mapType(s.type)
            const value = s.value !== undefined ? s.value : origin.getLimit(mappedType).max
            doll.appendPositiveStat(origin, mappedType, value)
          })
        }

        // 3. Setup Negative Stats
        let resultEquipment = null
        const isAutoNegative = !!payload.autoFindNegative
        
        if (payload.baseType !== undefined) {
          doll.config.baseType = payload.baseType
        }
        if (payload.autoFindType !== undefined) {
          doll.config.autoFindNegaitveStatsType = payload.autoFindType
        }

        let negativeStatsToUse: EnchantStat[] = []
        if (isAutoNegative) {
          const manuallyStats: EnchantStat[] = []
          if (Array.isArray(payload.negativeStats)) {
            payload.negativeStats.forEach((s: any) => {
              const statBase = Grimoire.Character.findStatBase(s.baseId)
              if (!statBase) return
              const origin = Grimoire.Enchant.findEnchantItem(statBase)
              if (!origin) return
              const mappedType = mapType(s.type)
              const value = s.value !== undefined ? s.value : origin.getLimit(mappedType).min
              manuallyStats.push(new EnchantStat(origin, mappedType, value))
            })
          }
          const autoResult = doll.autoFindNegaitveStats(manuallyStats)
          negativeStatsToUse = autoResult.stats
        } else {
          if (Array.isArray(payload.negativeStats)) {
            payload.negativeStats.forEach((s: any) => {
              const statBase = Grimoire.Character.findStatBase(s.baseId)
              if (!statBase) return
              const origin = Grimoire.Enchant.findEnchantItem(statBase)
              if (!origin) return
              const mappedType = mapType(s.type)
              const value = s.value !== undefined ? s.value : origin.getLimit(mappedType).min
              negativeStatsToUse.push(new EnchantStat(origin, mappedType, value))
            })
          }
        }

        // 4. Calculate
        if (autoFindPotentialMinimum) {
          // Implement autoFindPotentialMinimum calculation
          let left = 1,
            right = 150,
            mid = Math.floor((left + right) / 2)
          let cur = doll.calc(negativeStatsToUse, mid)!
          while (right - left > 1) {
            if (cur.realSuccessRate <= 100) {
              left = mid
            } else {
              right = mid
            }
            mid = Math.floor((left + right) / 2)
            cur = doll.calc(negativeStatsToUse, mid)!
          }
          if (cur.realSuccessRate < 100) {
            cur = doll.calc(negativeStatsToUse, right)!
          }
          eq.originalPotential = cur.originalPotential
          resultEquipment = cur
        } else {
          resultEquipment = doll.calc(negativeStatsToUse)
        }

        if (resultEquipment) {
          doll.optimizeResults()
        }

        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          success: true,
          originalPotential: eq.originalPotential,
          realSuccessRate: resultEquipment ? resultEquipment.realSuccessRate : 0,
          steps: resultEquipment ? resultEquipment.steps().map(step => ({
            type: step.type,
            stepPotential: step.stepPotential,
            remainingPotential: step.remainingPotential,
            text: step.toString()
          })) : []
        }))
      } catch (err: any) {
        console.error('API Error:', err)
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' })
        }
        res.end(JSON.stringify({ success: false, error: err.message || err }))
      }
    })
    return
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' })
  res.end('Not Found')
})

const PORT = 9040
initDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`EnchantDoll API Server is running on http://localhost:${PORT}`)
  })
}).catch(err => {
  console.error('Failed to initialize database:', err)
})
