import { getUnixTime, subDays, subWeeks, startOfMinute } from 'date-fns'
import { GraphQLClient } from 'graphql-request'
import { getGQLHeaders } from 'utils/graphql'
import requestWithTimeout from 'utils/requestWithTimeout'
import util from 'util'

/**
 * Helper function to get large amount GraphQL subqueries
 * @param queryConstructor constructor function that combines subqueries
 * @param subqueries individual queries
 * @param endpoint GraphQL endpoint
 * @param skipCount how many subqueries to fire at a time
 * @returns
 */
export const multiQuery = async (
  queryConstructor: (subqueries: string[]) => string,
  subqueries: string[],
  endpoint: string,
  skipCount = 1000,
) => {
  let fetchedData = {}
  let allFound = false
  let skip = 0
  console.log(`endpointzzz:  + ${endpoint}`)
  const client = new GraphQLClient(endpoint, { headers: getGQLHeaders(endpoint) })
  try {
    console.log('hereaaaaa')
    /* eslint-disable no-await-in-loop */
    while (!allFound) {
      let end = subqueries.length
      if (skip + skipCount < subqueries.length) {
        end = skip + skipCount
      }
      console.log('requestWithTimeout before')
      const subqueriesSlice = subqueries.slice(skip, end)
      // eslint-disable-next-line no-await-in-loop
      //      console.log("subqueriesSlice" +subqueriesSlice)
      // if(endpoint==="http://73.131.65.17:8000/subgraphs/name/pancakeswap/exchange")
      //  console.log(`AAAAA + ${queryConstructor(subqueriesSlice)}`)
      const result: any = await requestWithTimeout(client, queryConstructor(subqueriesSlice))
      fetchedData = {
        ...fetchedData,
        ...result,
      }
      const resultStr = util.inspect(result)
      console.log(`result requestWithTimeout : ${resultStr} `)
      allFound = Object.keys(result).length < skipCount || skip + skipCount > subqueries.length
      skip += skipCount
    }
    /* eslint-disable no-await-in-loop */
    return fetchedData
  } catch (error) {
    console.error('Failed to fetch info data', error)
    return null
  }
}

/**
 * Returns UTC timestamps for 24h ago, 48h ago, 7d ago and 14d ago relative to current date and time
 */
export const getDeltaTimestamps = (): [number, number, number, number] => {
  const utcCurrentTime = getUnixTime(new Date()) * 1000
  const t24h = getUnixTime(startOfMinute(subDays(utcCurrentTime, 1)))
  const t48h = getUnixTime(startOfMinute(subDays(utcCurrentTime, 2)))
  const t7d = getUnixTime(startOfMinute(subWeeks(utcCurrentTime, 1)))
  const t14d = getUnixTime(startOfMinute(subWeeks(utcCurrentTime, 2)))
  return [t24h, t48h, t7d, t14d]
}
