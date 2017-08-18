'use strict';
const should = require('should');
const sinon = require('sinon');
const AssetController = require('./../lib/assets');

const spentTxId = '614fe1708825f9c21732394e4784cc6808ac1d8b939736bfdead970567561eec';
const spentIndex = 1;
const detailedTransaction = {
  hex: '7b5485d3628922f004f470f497f6a83f6df4df347e1bce15831a964623f8072b565f7c7bc5dcbc717c6e2a2301a2f6b4a19e65042ad88c9f5d037628de38603c4f137f625e135691e2bd0169cab74e1368abe858f3c3d116e9d13c4c85ead129d9edf0245a3fb1b35561bd230607dca0dcaf3cffc735a3982d8384a1ecc5d622a7bb4db8b5d47d061701978b1f45e2e39946d66c3394f8a20b8ac8c931a6786f761da2d0f3fa2c7c93edee9f2a94de7c47510498767c3d87afe68815bd6058710bf5d8c850a5d20fc217943d9c00da58a4908d92a0912578247746f2086e54cb7b81b6a9e3cc1741457e956d41bdeaae06c441db96ec39a2d17147dd8f468eeaeaaa78dc2e53d66188a791c46b2a4965639ad72a2b90ee52786e36db1a8cf924346b105a40b41a3027dae657782ef7e8b56d6da86062184cb5366d4886cd2ce27471d9d62d1df447f2e5a9641e1f8d1f2b628054d3bd915bf7932bcec6f2dd4965e2406b1dba445b5493ee475757de332618220318dd806b880a7364370c5c0c3b736a653f97b2901fdb5cf4b5b2230b09b2d7bd324a392633d51c598765f9bd286421239a1f25db34a9a61f645eb601e59f10fc1b',
  hash: 'b85334bf2df35c6dd5b294efe92ffc793a78edff75a2ca666fc296ffb04bbba0',
  version: 1,
  blockHash: '0000000000000afa0c3c0afd450c793a1e300ec84cbe9555166e06132f19a8f7',
  height: 533974,
  blockTimestamp: 1440987503,
  inputSatoshis: 34955390,
  outputSatoshis: 34925390,
  feeSatoshis: 30000,
  inputs: [
    {
      address: 'mqdofsXHpePPGBFXuwwypAqCcXi48Xhb2f',
      prevTxId: '87c9b0f27571fff14b8c2d69e55614eacedd0f59fcc490b721320f9dae145aad',
      outputIndex: 0,
      sequence: 4294967295,
      script: '4830450221008e5df62719cd92d7b137d00bbd27f153f2909bcad3a300960bc1020ec6d5e961022039df51600ff4fb5da5a794d1648c6b47c1f7d277fd5877fb5e52a730a3595f8c014104eb1e0ccd9afcac42229348dd776e991c69551ae3474340fada12e787e51758397e1d3afdba360d6374261125ea3b6ea079a5f202c150dfd729e1062d9176a307',
      scriptAsm: '30450221008e5df62719cd92d7b137d00bbd27f153f2909bcad3a300960bc1020ec6d5e961022039df51600ff4fb5da5a794d1648c6b47c1f7d277fd5877fb5e52a730a3595f8c01 04eb1e0ccd9afcac42229348dd776e991c69551ae3474340fada12e787e51758397e1d3afdba360d6374261125ea3b6ea079a5f202c150dfd729e1062d9176a307',
      satoshis: 18535505,
    },
    {
      address: 'mqdofsXHpePPGBFXuwwypAqCcXi48Xhb2f',
      prevTxId: 'd8a10aaedf3dd33b5ddf8979273f3dbf61e4638d1aa6a93c59ea22bc65ac2196',
      outputIndex: 0,
      sequence: 4294967295,
      script: '4730440220761464d7bab9515d92260762a97af82a9b25d202d8f7197b1aaec81b6fed541f022059f99606de6b06e17b2cd102dceb3807ebdd9e777a5b77c9a0b3672f5eabcb31014104eb1e0ccd9afcac42229348dd776e991c69551ae3474340fada12e787e51758397e1d3afdba360d6374261125ea3b6ea079a5f202c150dfd729e1062d9176a307',
      scriptAsm: '30440220761464d7bab9515d92260762a97af82a9b25d202d8f7197b1aaec81b6fed541f022059f99606de6b06e17b2cd102dceb3807ebdd9e777a5b77c9a0b3672f5eabcb3101 04eb1e0ccd9afcac42229348dd776e991c69551ae3474340fada12e787e51758397e1d3afdba360d6374261125ea3b6ea079a5f202c150dfd729e1062d9176a307',
      satoshis: 16419885,
    },
  ],
  outputs: [
    {
      satoshis: 21247964,
      script: '76a9144b7b335f978f130269fe661423258ae9642df8a188ac',
      scriptAsm: 'OP_DUP OP_HASH160 4b7b335f978f130269fe661423258ae9642df8a1 OP_EQUALVERIFY OP_CHECKSIG',
      address: 'mnQ4ZaGessNgdxmWPxbTHcfx4b8R6eUr1X',
    },
    {
      address: 'mqdofsXHpePPGBFXuwwypAqCcXi48Xhb2f',
      satoshis: 13677426,
      scriptAsm: 'OP_DUP OP_HASH160 6efcf883b4b6f9997be9a0600f6c095fe2bd2d92 OP_EQUALVERIFY OP_CHECKSIG',
      script: '76a9146efcf883b4b6f9997be9a0600f6c095fe2bd2d9288ac',
      spentTxId: spentTxId,
      spentIndex: spentIndex,
      spentHeight: 10,
    },
  ],
  locktime: 0,
};

const utxos = [
  {
    "addresses": [
      "mwrPT9XidZ4KvtdfvbkCaSS5GtakZzXp6J",
    ],
    "txid": "a3003756db8dd832087b98c5adcce8e1fade89959519713edecccadc44a4d2f4",
    "value": 30000,
  },
  {
    "addresses": [
      "mwrPT9XidZ4KvtdfvbkCaSS5GtakZzXp6J",
    ],
    "txid": "a3003756db8dd832087b98c5adcce8e1fade89959519713edecccadc44a4d2f4",
    "value": 25000,
  },
  {
    "addresses": [
      "mwrPT9XidZ4KvtdfvbkCaSS5GtakZzXp6J",
    ],
    "txid": "32e3c6c28b50183c9b407fb3ab4d83ea0d3ad195325253784772beea0db82c34",
    "value": 20000,
  },
  {
    "addresses": [
      "mwrPT9XidZ4KvtdfvbkCaSS5GtakZzXp6J",
    ],
    "txid": "a3003756db8dd832087b98c5adcce8e1fade89959519713edecccadc44a4d2f4",
    "value": 15000,
  },
  {
    "addresses": [
      "mwrPT9XidZ4KvtdfvbkCaSS5GtakZzXp6J",
    ],
    "txid": "a3003756db8dd832087b98c5adcce8e1fade89959519713edecccadc44a4d2f4",
    "value": 15000,
  },
];

describe.only('AssetController', () => {
// _evaluateBuildTxn
// _loadMinimumUtxosCycle DONE
// _loadBestUtxos DONE

  describe('_calculateMiningFee', () => {
    const node = {};
    const controller = new AssetController(node);
    let ins = 1;
    let outs = 30;
    let feeRate = 100000;
    let fee;

    it('should calculate and return the Mining Fee', () => {
      let miningFee = controller._calculateMiningFee(ins, outs, feeRate);
      fee = miningFee;
      should(fee).be.a.Number();
      miningFee = controller._calculateMiningFee(++ins, outs, feeRate);
      should(miningFee).be.exactly(fee + 18000);
      fee = miningFee;
      miningFee = controller._calculateMiningFee(++ins, ++outs, feeRate);
      should(miningFee).be.exactly(fee + 18000 + 3400);
    });
  });

  describe('_calculateInputsValue', () => {
    it('should return the total sum of utxos value', () => {
      const inputsValue = AssetController.prototype._calculateInputsValue(utxos);
      should(inputsValue).be.exactly(105000);
    });
  });

  describe('_evaluateInputsValue', () => {
    const node = {};
    const controller = new AssetController(node);
    const body = {
      utxos: [ { value: 30000 } ],
      amount: 30000,
    };

    it('should not reach the value needed, not enough utxos value', () => {
      const txn = {
        ins: new Array(1),
        outs: new Array(30),
      };
      const result = controller._evaluateInputsValue(body, txn, 100000);
      should(result.pass).be.exactly(false);
      should(result.valueNeeded).be.exactly(151000);
    });

    it('should pass and complete the value needed with one utxo', () => {
      const txn = {
        ins: new Array(1),
        outs: new Array(30),
      };
      body.utxos = [ { value: 160000 } ];
      const result = controller._evaluateInputsValue(body, txn, 100000);
      should(result.pass).be.exactly(true);
      should(result.valueNeeded).be.exactly(151000);
    });

    it('should pass and complete the value needed with three utxos', () => {
      const txn = {
        ins: new Array(3),
        outs: new Array(30),
      };
      body.utxos = [ { value: 100000 }, { value: 50000 }, { value: 40000 } ];
      const result = controller._evaluateInputsValue(body, txn, 100000);
      should(result.pass).be.exactly(true);
      should(result.valueNeeded).be.exactly(187000);
    });
  });

  describe('_findUtxosMaxValue', () => {
    const node = {};
    const controller = new AssetController(node);
    it('should return the highest value utxo', () => {
      controller._findUtxosMaxValue(utxos, false)
        .then((maxUtxo) => {
          should(maxUtxo[0].value).be.exactly(30000);
        });
    });
  });

  describe('_populateUtxosAssets', () => {
    const node = {
      getDetailedTransaction: sinon.stub().callsArgWith(1, null, detailedTransaction),
      services: {
        bitcoind: {
          height: 534203,
        },
      },
    };
    const controller = new AssetController(node);
    const utxosToPopulate = [].concat(utxos);

    it('should populate the assets for the utxo provided', () => {
      controller._populateUtxosAssets(utxosToPopulate)
        .then(() => {
          should(utxosToPopulate[0]).have.property('assets');
          should(utxosToPopulate[1]).have.property('assets');
          should(utxosToPopulate[2]).have.property('assets');
        });
    });
  });

  describe('_loadBestUtxos', () => {
    const node = {
      services: {
        bitcoind: {
          height: 534203,
        },
      },
    };
    const handle = {
      utxos: [].concat(utxos),
      utxosIterator: 0,
      valueNeeded: 25000,
      includeAssets: false,
      choosenUtxos: [],
    };

    describe('when the first one is enough', () => {
      const handleToTest = Object.assign({}, handle);
      const controller = new AssetController(node);
      it('should get the higher value utxo only', () => {
        controller._loadBestUtxos(handleToTest)
          .then((neededUtxos) => {
            should(neededUtxos.length).be.exactly(1);
          });
      });
    });

    describe('when two are needed', () => {
      const handleToTest = Object.assign({}, handle);
      handleToTest.valueNeeded = 40000;
      handle.utxos.shift(); // remove the highest utxo to need more
      const controller = new AssetController(node);
      it('should get the first two utxo with higher value', () => {
        controller._loadBestUtxos(handleToTest)
          .then((neededUtxos) => {
            should(neededUtxos.length).be.exactly(2);
          });
      });
    });

    describe('when more are needed', () => {
      const handleToTest = Object.assign({}, handle);
      handleToTest.valueNeeded = 60000;
      handle.utxos.shift(); // remove the highest utxo to need more
      const controller = new AssetController(node);
      it('should get the first three utxo with higher value', () => {
        controller._loadBestUtxos(handleToTest)
          .then((neededUtxos) => {
            should(neededUtxos.length).be.exactly(4);
          });
      });
    });

    describe('when there are not utxos available', () => {
      const handleToTest = Object.assign({}, handle);
      handleToTest.utxos = [];
      const controller = new AssetController(node);
      it('should throw insufficient funds error', () => {
        controller._loadBestUtxos(handleToTest)
          .catch((err) => {
            should(err.message).be.exactly('Not enough funds to make the transaction');
          });
      });
    });
  });

  describe('_loadMinimumUtxosCycle', () => {
    const body = { address: 1, amount: 30000 };
    const buildObject = (numUtxos) => {
      return {
        txb: {
          tx: {
            ins: new Array(numUtxos),
            outs: new Array(30),
          },
        },
      };
    };
    const handle = {
      body,
      type: 'issue',
      feeRate: 100000,
      utxosIterator: 0,
      valueNeeded: 90000,
      includeAssets: false,
      choosenUtxos: [],
    };

    describe('when the utxos are enough', () => {
      const utxosToTest = [
        {
          txid: "a3003756db8dd832087b98c5adcce8e1fade89959519713edecccadc44a4d2f4",
          value: 100000,
        },
        {
          txid: "a3003756db8dd832087b98c5adcce8e1fade89959519713edecccadc44a4d2f4",
          value: 50000,
        },
        {
          txid: "a3003756db8dd832087b98c5adcce8e1fade89959519713edecccadc44a4d2f4",
          value: 40000,
        },
      ];
      const node = {
        getAddressUnspentOutputs: sinon.stub().callsArgWith(2, null, utxosToTest),
        services: {
          bitcoind: {
            height: 534203,
          },
        },
      };
      const handleToTest = Object.assign({}, handle);
      const controller = new AssetController(node);
      handleToTest.utxos = utxosToTest;
      controller.ccBuildTypes.issue = (body) => { return buildObject(body.utxos.length); };

      it('should cycle through utxos until it achieves the value needed', () => {
        controller._loadMinimumUtxosCycle(handleToTest)
          .then((buildTxn) => {
            should(buildTxn.txb.tx.ins.length).be.exactly(3);
          });
      });
    });

    describe('when the utxos are NOT enough', () => {
      const utxosToTest = [
        {
          txid: "a3003756db8dd832087b98c5adcce8e1fade89959519713edecccadc44a4d2f4",
          value: 90000,
        },
        {
          txid: "a3003756db8dd832087b98c5adcce8e1fade89959519713edecccadc44a4d2f4",
          value: 20000,
        },
        {
          txid: "a3003756db8dd832087b98c5adcce8e1fade89959519713edecccadc44a4d2f4",
          value: 10000,
        },
      ];
      const node = {
        getAddressUnspentOutputs: sinon.stub().callsArgWith(2, null, utxosToTest),
        services: {
          bitcoind: {
            height: 534203,
          },
        },
      };
      const handleToTest = Object.assign({}, handle);
      const controller = new AssetController(node);
      handleToTest.utxos = utxosToTest;
      controller.ccBuildTypes.issue = (body) => { return buildObject(body.utxos.length); };
      controller.addressController._utxo = sinon.stub().callsArgWith(2, null, [].concat(utxosToTest));

      it('should cycle through utxos and return insufficient funds', () => {
        controller._loadMinimumUtxosCycle(handleToTest)
          .catch((err) => {
            should(err.message).be.exactly('Not enough funds to make the transaction');
          });
      });
    });

    describe('when there are not utxos to spend', () => {
      const utxosToTest = [];
      const node = {
        getAddressUnspentOutputs: sinon.stub().callsArgWith(2, null, utxosToTest),
        services: {
          bitcoind: {
            height: 534203,
          },
        },
      };
      const handleToTest = Object.assign({}, handle);
      const controller = new AssetController(node);
      handleToTest.utxos = utxosToTest;
      controller.ccBuildTypes.issue = (body) => { return buildObject(body.utxos.length); };
      controller.addressController._utxo = sinon.stub().callsArgWith(2, null, [].concat(utxosToTest));

      it('should return the address does not have inputs immediately', () => {
        controller._loadMinimumUtxosCycle(handleToTest)
          .catch((err) => {
            should(err.message).be.exactly('The address does not have inputs');
          });
      });
    });
  });

  describe('_evaluateBuildTxn', () => {
    const buildObject = (numUtxos) => {
      return {
        txb: {
          tx: {
            ins: new Array(numUtxos),
            outs: new Array(30),
          },
        },
      };
    };
    const utxosToTest = [
      {
        txid: "a3003756db8dd832087b98c5adcce8e1fade89959519713edecccadc44a4d2f4",
        value: 100000,
      },
      {
        txid: "a3003756db8dd832087b98c5adcce8e1fade89959519713edecccadc44a4d2f4",
        value: 50000,
      },
      {
        txid: "a3003756db8dd832087b98c5adcce8e1fade89959519713edecccadc44a4d2f4",
        value: 40000,
      },
    ];
    const handle = {
      type: 'issue',
      utxosIterator: 0,
      includeAssets: false,
      choosenUtxos: [],
    };

    describe('when the current utxo is enough', () => {
      const body = {
        address: 1,
        amount: 30000,
        utxos: [
          {
            txid: "a3003756db8dd832087b98c5adcce8e1fade89959519713edecccadc44a4d2f4",
            value: 2000000,
          },
        ],
      };
      const node = {
        getAddressUnspentOutputs: sinon.stub().callsArgWith(2, null, utxosToTest),
        services: {
          bitcoind: {
            height: 534203,
          },
        },
      };
      const handleToTest = Object.assign({}, handle, { utxos: body.utxos, body });
      const controller = new AssetController(node);
      controller.ccBuildTypes.issue = (body) => { return buildObject(body.utxos.length); };
      controller._fetchEstimateFeeRate = () => new Promise((resolve) => { resolve(100000); });

      it('should execute res.jsonp without running the cycle', (done) => {
        const res = {
          jsonp: (result) => {
            should(result.txb.tx.ins.length).be.exactly(1);
            done();
          },
        };
        controller._evaluateBuildTxn(handleToTest, res);
      });
    });

    describe('when the current utxo is NOT enough', () => {
      const body = {
        address: 1,
        amount: 30000,
        utxos: [
          {
            txid: "a3003756db8dd832087b98c5adcce8e1fade89959519713edecccadc44a4d2f4",
            value: 100000,
          },
        ],
      };
      const node = {
        getAddressUnspentOutputs: sinon.stub().callsArgWith(2, null, utxosToTest),
        services: {
          bitcoind: {
            height: 534203,
          },
        },
      };
      const handleToTest = Object.assign({}, handle, { utxos: utxosToTest, body });
      const controller = new AssetController(node);
      controller.ccBuildTypes.issue = (body) => { return buildObject(body.utxos.length); };
      controller._fetchEstimateFeeRate = () => new Promise((resolve) => { resolve(100000); });

      it('should execute res.jsonp after running the cycle', (done) => {
        const res = {
          jsonp: (result) => {
            should(result.txb.tx.ins.length).be.exactly(3);
            done();
          },
        };
        controller._evaluateBuildTxn(handleToTest, res);
      });
    });

    describe('when there are not utxos for the address', () => {
      const body = {
        address: 1,
        amount: 30000,
        utxos: [],
      };
      const node = {
        getAddressUnspentOutputs: sinon.stub().callsArgWith(2, null, []),
        services: {
          bitcoind: {
            height: 534203,
          },
        },
      };
      const handleToTest = Object.assign({}, handle, { utxos: [], body });
      const controller = new AssetController(node);
      controller.ccBuildTypes.issue = (body) => { return buildObject(body.utxos.length); };
      // controller.addressController._utxo = sinon.stub().callsArgWith(2, null, []);
      controller._fetchEstimateFeeRate = () => new Promise((resolve) => { resolve(100000); });

      it('should execute res.jsonp after running the cycle', (done) => {
        const res = { jsonp: () => {} };
        controller.common.handleErrors = (err) => {
          should(err.message).be.exactly('Not enough funds to make the transaction');
          done();
        };
        controller._evaluateBuildTxn(handleToTest, res);
      });
    });
  });
});

/*const ColoredCoinsBuilder = require('../cc-transaction-builder/index')

const litecoinTestnet  = bitcoinjs.networks.litecoin_testnet

// ltc testnet
const address = 'mo4zvhJCKGXZXZCPAuLBWrQtbqM6BBcyAb'
const privateKey = '4d0d0f147cb1950f0a139aac8ce35d36793d30a6c9c65d2c7708fcd5808f41bb'
const privateKeyWif = 'cQAUijAZQtuKWNBZQuy7xM6utG1cEDWzjMQqZPoC71vhCeQyP5rq'
const keyPair = bitcoinjs.ECPair.fromWIF(privateKeyWif, litecoinTestnet)

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


// const address = "mo4zvhJCKGXZXZCPAuLBWrQtbqM6BBcyAb";
// const issueAddress = "mwrPT9XidZ4KvtdfvbkCaSS5GtakZzXp6J";
// const body = {
//   address:address,
//   issueAddress: issueAddress,
//   amount: 1,
//   divisibility: 0,
//   fee: 50000,
//   flags: {
//     injectPreviousOutput: false,
//   },
//   metadata: {
//     assetName: 'Testing',
//   },
// };


// const request = require('request');
// const bitcoinjs = require('bitcoinjs-lib');
// require('bitcoinjs-testnets').register(bitcoinjs.networks);
// const litecoinTestnet  = bitcoinjs.networks.litecoin_testnet;

// const privateKey = '4d0d0f147cb1950f0a139aac8ce35d36793d30a6c9c65d2c7708fcd5808f41bb';
// const privateKeyWif = 'cQAUijAZQtuKWNBZQuy7xM6utG1cEDWzjMQqZPoC71vhCeQyP5rq';
// const keyPair = bitcoinjs.ECPair.fromWIF(privateKeyWif, litecoinTestnet);


// request({
//   url: 'http://localhost:3001/insight-lite-cc-api/assets/issue',
//   method: 'POST',
//   json: body
// }, function(err, response, body){
//    console.log(body);
//    if (!err){
//     console.log(" Issuning Asset" + body.assetId);
//     console.log(" txHex " + body.txHex);

//     tx  = bitcoinjs.Transaction.fromHex(body.txHex)
//     txb = bitcoinjs.TransactionBuilder.fromTransaction(tx)


//     txb.network = litecoinTestnet

//     rawSignedTransaction = null
//     transaction = null

//     txb.tx.ins.forEach((input, index) => {
//     console.log(`singing index ${index}`)
//     // sign inputs

//     txb.sign(index, keyPair)

//         try {
//             transaction = txb.build()
//             rawSignedTransaction = transaction.toHex()
//             console.log('success')
//         } catch(e) {
//             if ('Transaction is missing signatures' == e.message) {
//              console.error(e.message)
//             rawSignedTransaction = txb.buildIncomplete().toHex()
//             } else if ('Not enough signatures provided' == e.message) {
//              console.error(e.message)
//              rawSignedTransaction = txb.buildIncomplete().toHex()
//             } else {
//                 console.error(e)
//             }
//         }
//     })
//      console.log(transaction)
//     console.log(`Generated tx hash: ${transaction.getId()}`)
//     console.log(`Signed hex: ${rawSignedTransaction}`)
//    }else{
//        console.log(err);
//    }
// });

/*

*/
