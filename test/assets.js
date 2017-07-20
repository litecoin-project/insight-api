
/*const ColoredCoinsBuilder = require('../cc-transaction-builder/index')

const litecoinTestnet  = bitcoinjs.networks.litecoin_testnet

// ltc testnet
const address = 'mo4zvhJCKGXZXZCPAuLBWrQtbqM6BBcyAb'
const private_key = '4d0d0f147cb1950f0a139aac8ce35d36793d30a6c9c65d2c7708fcd5808f41bb'
const private_key_wif = 'cQAUijAZQtuKWNBZQuy7xM6utG1cEDWzjMQqZPoC71vhCeQyP5rq'
const keyPair = bitcoinjs.ECPair.fromWIF(private_key_wif, litecoinTestnet)

const properties = {
  network: 'litecoin-testnet',
  returnBuilder: true,
  mindustvalue: 10000
}

const ccb = new ColoredCoinsBuilder(properties)
const result = ccb.buildIssueTransaction({
  utxos: [{
    txid: '86be3c570060440bdbe1dc507f728b22119b2f354b93c8045eefc47d464425b6',
    index: 0,
    value: 900000000,
    scriptPubKey: {
      addresses: [address],
      hex: '76a91452d8635d118a2f919c596caaee4420d8d45a699c88ac'
    }
  }],
  issueAddress: address,
  amount: 3,
  divisibility: 0,
  fee: 50000,
  flags: {
    injectPreviousOutput: false
  },
  metadata: {
    assetName: 'Testing'
  },
})

console.log(`Issunig Asset: ${result.assetId}`)
*/


var address="mo4zvhJCKGXZXZCPAuLBWrQtbqM6BBcyAb";
var issueAddress="mwrPT9XidZ4KvtdfvbkCaSS5GtakZzXp6J";
var body={
  address:address,
  issueAddress: issueAddress,
  amount: 3000,
  divisibility: 0,
  fee: 50000,
  flags: {
    injectPreviousOutput: false
  },
  metadata: {
    assetName: 'Testing'
  } /*
,utxos: [
        {
            txid: "c927089a205398393027c3c5f29052a4c1a65f9ab37f674b04121fd2b903531f",
            index: 1,
            value: 899949400,
            scriptPubKey: {
                hex: "76a91452d8635d118a2f919c596caaee4420d8d45a699c88ac",
                addresses: [
                    "mo4zvhJCKGXZXZCPAuLBWrQtbqM6BBcyAb"
                ]
            }
        }
    ] 
 ,utxos: [{
    txid: '86be3c570060440bdbe1dc507f728b22119b2f354b93c8045eefc47d464425b6',
    index: 0,
    value: 900000000,
    scriptPubKey: {
      addresses: [address],
      hex: '76a91452d8635d118a2f919c596caaee4420d8d45a699c88ac'
    }
  }]
 */
}


var request = require('request');
const bitcoinjs = require('bitcoinjs-lib')
require('bitcoinjs-testnets').register(bitcoinjs.networks);
const litecoinTestnet  = bitcoinjs.networks.litecoin_testnet

const private_key = '4d0d0f147cb1950f0a139aac8ce35d36793d30a6c9c65d2c7708fcd5808f41bb'
const private_key_wif = 'cQAUijAZQtuKWNBZQuy7xM6utG1cEDWzjMQqZPoC71vhCeQyP5rq'
const keyPair = bitcoinjs.ECPair.fromWIF(private_key_wif, litecoinTestnet)


request({
  url: 'http://localhost:3001/insight-lite-cc-api/assets/issue',
  method: 'POST',
  json: body
}, function(err, response, body){ 
   console.log(body);
   if (!err){
    console.log(" Issuning Asset" + body.assetId);
    console.log(" txHex " + body.txHex); 
    
    tx  = bitcoinjs.Transaction.fromHex(body.txHex)
    txb = bitcoinjs.TransactionBuilder.fromTransaction(tx)
 
    
    txb.network = litecoinTestnet

    rawSignedTransaction = null
    transaction = null

    txb.tx.ins.forEach((input, index) => {
    console.log(`singing index ${index}`)
    // sign inputs
 
    txb.sign(index, keyPair)

        try {
            transaction = txb.build()
            rawSignedTransaction = transaction.toHex()
            console.log('success')
        } catch(e) {
            if ('Transaction is missing signatures' == e.message) {
             console.error(e.message)
            rawSignedTransaction = txb.buildIncomplete().toHex()
            } else if ('Not enough signatures provided' == e.message) {
             console.error(e.message)
             rawSignedTransaction = txb.buildIncomplete().toHex()
            } else {
                console.error(e)
            }
        }
    })
     console.log(transaction)
    console.log(`Generated tx hash: ${transaction.getId()}`)
    console.log(`Signed hex: ${rawSignedTransaction}`)
   }else{
       console.log(err);
   }
});

/* 
{
    "txid": "46e85e1e50ca6c53ab74827215017bb8e3326a26910fe455073edb0214b412c3"
}
{
    "txid": "08ce8594eb3e2711b6cefab0f6097f17045e6f9d83da25a933cc64447016e7c8"
}
{
    "txid": "154fd301cab69dc9065b3f4aee1064592776ae8732f4f42c8b998175a7aa93d2"
}
{
    mwrPT9XidZ4KvtdfvbkCaSS5GtakZzXp6J
    "txid": "3fb8b7e9f044b501032f0627c0124764318a0a47421eb47832ff055e2891d7c6"
}
*/
