import { SubstrateExtrinsic } from '@subql/types'
import type { Extrinsic } from '@polkadot/types/interfaces'
import { MoonbeamTermsSigned } from '../types'

const MoonBeamTermsPDFHash = `0xc45eb5338b5879ff89d59ecf722cfede2e19a82bdec1948fbb2a0457e1ce3594`

const parseRemark = (remark: { toString: () => string }) => {
  logger.info(`Remark is ${remark.toString()}`)
  return Buffer.from(remark.toString().slice(2), 'hex').toString('utf8')
}

const checkTransaction = (sectionFilter: string, methodFilter: string, call: Extrinsic) => {
  const {
    method: { method, section },
  } = call
  return section === sectionFilter && method === methodFilter
}

export async function moonbeamTermsSigned(extrinsic: SubstrateExtrinsic): Promise<void> {
  const {
    isSigned,
    method: { args },
  } = extrinsic.extrinsic

  if (!checkTransaction('system', 'remark', extrinsic.extrinsic) || !isSigned || !args[0]) {
    return
  }

  const remark = parseRemark(args[0])
  if (remark === `MoonBeamTermsPDFHash::${MoonBeamTermsPDFHash}`) {
    logger.info(remark)
    let account = extrinsic.extrinsic.signer.toString()
    const record = await MoonbeamTermsSigned.get(account)
    if (record) {
      return
    }

    const newRecord = MoonbeamTermsSigned.create({
      id: extrinsic.extrinsic.hash.toString(),

      blockHeight: extrinsic.block.block.header.number.toNumber(),
      account,
      timestamp: extrinsic.block.timestamp,
    })

    await newRecord.save()
  }
}
