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
  describe('_getUtxo', () => {
    describe('When the address has some utxos with and without confirmations', () => {
      const utxosToTest = [
        { value: 20000, confirmations: 0 },
        { value: 40000, confirmations: 30 },
        { value: 50000, confirmations: 0 },
        { value: 10000, confirmations: 1 },
        { value: 30000, confirmations: 4 },
      ];
      const node = {};
      const controller = new AssetController(node);
      controller.addressController._utxo = sinon.stub().callsArgWith(2, null, [].concat(utxosToTest));

      it('Should filter utxos without confirmations and sort them', (done) => {
        controller._getUtxo('dummy_address')
          .then((resultUtxos) => {
            should(resultUtxos.length).be.exactly(3);
            should(resultUtxos[0].value).be.exactly(40000);
            should(resultUtxos[2].value).be.exactly(10000);
            done();
          })
          .catch(done);
      });
    });

    describe('When the address has utxos but NONE have confirmations', () => {
      const utxosToTest = [
        { value: 20000, confirmations: 0 },
        { value: 40000, confirmations: 0 },
        { value: 50000, confirmations: 0 },
      ];
      const node = {};
      const controller = new AssetController(node);
      controller.addressController._utxo = sinon.stub().callsArgWith(2, null, [].concat(utxosToTest));

      it('Should filter utxos and return "MSG_NO_INPUTS_CONFIRMED"', (done) => {
        controller._getUtxo('dummy_address')
          .then(() => {
            done('should not return utxos');
          })
          .catch((err) => {
            should(err.message).be.exactly('The address does not have inputs with confirmations');
            done();
          });
      });
    });

    describe('When the address does not have utxos', () => {
      const utxosToTest = [];
      const node = {};
      const controller = new AssetController(node);
      controller.addressController._utxo = sinon.stub().callsArgWith(2, null, [].concat(utxosToTest));

      it('Should filter utxos and return "MSG_NO_INPUTS_ADDRESS"', (done) => {
        controller._getUtxo('dummy_address')
          .then(() => {
            done('should not return utxos');
          })
          .catch((err) => {
            should(err.message).be.exactly('The address does not have inputs');
            done();
          });
      });
    });
  });

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

    it('should return the minimum required fee', () => {
      let miningFee = controller._calculateMiningFee(1, 1, feeRate);
      should(miningFee).be.exactly(100000);
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
      utxos: [],
      amount: 30000,
    };
    controller._calculateMiningFee = () => 100000;

    it('should not reach the value needed, not enough utxos value', () => {
      const txn = {
        ins: new Array(1),
        outs: new Array(30),
      };
      controller._calculateInputsValue = () => 100000;
      const result = controller._evaluateInputsValue(body, txn, 100000);
      should(result.pass).be.exactly(false);
      should(result.valueNeeded).be.exactly(130000);
    });

    it('should pass with the enough inputs value', () => {
      const txn = {
        ins: new Array(1),
        outs: new Array(30),
      };
      controller._calculateInputsValue = () => 150000;
      const result = controller._evaluateInputsValue(body, txn, 100000);
      should(result.pass).be.exactly(true);
      should(result.valueNeeded).be.exactly(130000);
    });
  });

  describe('_findUtxosMaxValue', () => {
    const node = {
      getDetailedTransaction: sinon.stub().callsArgWith(1, null, detailedTransaction),
      services: {
        bitcoind: {
          height: 534203,
        },
      },
    };
    const controller = new AssetController(node);
    const utxosOne = [ { value: 10000 }, { value: 30000 }, { value: 20000 } ];
    const utxosTwo = [ { value: 10000 }, { value: 30000 }, { value: 60000 }, { value: 15000 } ];

    describe('When assets are NOT required', () => {
      it('should return the highest value for utxosOne', (done) => {
        controller._findUtxosMaxValue(utxosOne, false)
          .then((maxUtxo) => {
            should(maxUtxo[0].value).be.exactly(30000);
            done();
          })
          .catch(done);
      });

      it('should return the highest value for utxosTwo', (done) => {
        controller._findUtxosMaxValue(utxosTwo, false)
          .then((maxUtxo) => {
            should(maxUtxo[0].value).be.exactly(60000);
            done();
          })
          .catch(done);
      });
    });

    describe('When assets are required', () => {
      it('should return the highest value for utxosOne with assets defined', (done) => {
        controller._findUtxosMaxValue(utxosOne, true)
          .then((maxUtxo) => {
            should(maxUtxo[0].value).be.exactly(30000);
            should(maxUtxo[0]).have.property('assets');
            done();
          })
          .catch(done);
      });

      it('should return the highest value for utxosTwo with assets defined', (done) => {
        controller._findUtxosMaxValue(utxosTwo, true)
          .then((maxUtxo) => {
            should(maxUtxo[0].value).be.exactly(60000);
            should(maxUtxo[0]).have.property('assets');
            done();
          })
          .catch(done);
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

    it('should populate the assets for the utxo provided', (done) => {
      controller._populateUtxosAssets(utxosToPopulate)
        .then(() => {
          should(utxosToPopulate[0]).have.property('assets');
          should(utxosToPopulate[1]).have.property('assets');
          should(utxosToPopulate[2]).have.property('assets');
          done();
        })
        .catch(done);
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
      utxosIterator: 0,
      valueNeeded: 25000,
      includeAssets: false,
      choosenUtxos: [],
    };

    describe('when the first one is enough', () => {
      const handleToTest = Object.assign({}, handle);
      const controller = new AssetController(node);
      handleToTest.utxos = [ { value: 30000 }, { value: 15000 } ];
      it('should get the higher value utxo only', (done) => {
        controller._loadBestUtxos(handleToTest)
          .then((neededUtxos) => {
            should(neededUtxos.length).be.exactly(1);
            done();
          })
          .catch(done);
      });
    });

    describe('when two are needed', () => {
      const handleToTest = Object.assign({}, handle);
      handleToTest.valueNeeded = 40000;
      handleToTest.utxos = [ { value: 30000 }, { value: 15000 } ];
      const controller = new AssetController(node);
      it('should get the first two utxo with higher value', (done) => {
        controller._loadBestUtxos(handleToTest)
          .then((neededUtxos) => {
            should(neededUtxos.length).be.exactly(2);
            done();
          })
          .catch(done);
      });
    });

    describe('when more are needed', () => {
      const handleToTest = Object.assign({}, handle);
      handleToTest.valueNeeded = 60000;
      handleToTest.utxos = [ { value: 30000 }, { value: 20000 }, { value: 15000 } ];
      const controller = new AssetController(node);
      it('should get the first three utxo with higher value', (done) => {
        controller._loadBestUtxos(handleToTest)
          .then((neededUtxos) => {
            should(neededUtxos.length).be.exactly(3);
            done();
          })
          .catch(done);
      });
    });

    describe('when there are not utxos available', () => {
      const handleToTest = Object.assign({}, handle);
      handleToTest.utxos = [];
      const controller = new AssetController(node);
      it('should throw insufficient funds error', (done) => {
        controller._loadBestUtxos(handleToTest)
          .then(() => {
            done('should throw not enough funds');
          })
          .catch((err) => {
            should(err.message).be.exactly('Not enough funds to make the transaction');
            done();
          });
      });
    });
  });

  describe('_loadMinimumUtxosCycle', () => {
    const body = { address: 1, amount: 30000 };
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
        { value: 100000 },
        { value: 50000 },
        { value: 40000 },
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
      const buildObject = { txb: { tx: { ins: new Array(2), outs: new Array(30) } } };
      handleToTest.utxos = utxosToTest;
      controller.ccBuildTypes = { issue: () => buildObject };
      controller._loadBestUtxos = () => new Promise((resolve) => { resolve(); });
      controller._evaluateInputsValue = () => new Promise((resolve) => { resolve({ pass: true, valueNeeded: 120000 }); });

      it('should cycle through utxos until it achieves the value needed', (done) => {
        controller._loadMinimumUtxosCycle(handleToTest)
          .then((buildTxn) => {
            should(buildTxn.txb.tx.ins.length).be.exactly(2);
            done();
          })
          .catch(done);
      });
    });

    describe('when more than one cycle is needed', () => {
      const utxosToTest = [
        { value: 100000 },
        { value: 50000 },
        { value: 40000 },
      ];
      const node = {
        getAddressUnspentOutputs: sinon.stub().callsArgWith(2, null, utxosToTest),
        services: {
          bitcoind: {
            height: 534203,
          },
        },
      };
      let cyclesCounter = 0;
      const handleToTest = Object.assign({}, handle);
      const controller = new AssetController(node);
      const buildObject = { txb: { tx: { ins: new Array(5), outs: new Array(30) } } };
      handleToTest.utxos = utxosToTest;
      controller.ccBuildTypes = { issue: () => buildObject };
      controller._loadBestUtxos = () => new Promise((resolve) => { resolve(); });

      // Mocking the cycles, returning 'pass: false' until it gets some cycles count
      controller._evaluateInputsValue = () => {
        ++cyclesCounter;
        const evaluated = { pass: false, valueNeeded: 120000 };
        if (cyclesCounter === 3) evaluated.pass = true;
        return new Promise((resolve) => { resolve(evaluated); });
      };

      const evalInputsSpy = sinon.spy(controller, '_evaluateInputsValue');

      it('should cycle until it achieves the value needed (receives a successful inputs value)', (done) => {
        controller._loadMinimumUtxosCycle(handleToTest)
          .then(() => {
            should(evalInputsSpy.calledThrice).be.exactly(true);
            done();
          })
          .catch(done);
      });
    });

    describe('when the utxos are NOT enough', () => {
      const utxosToTest = [
        { value: 90000 },
        { value: 20000 },
        { value: 10000 },
      ];
      const node = {
        getAddressUnspentOutputs: sinon.stub().callsArgWith(2, null, utxosToTest),
        services: {
          bitcoind: {
            height: 534203,
          },
        },
      };
      const finalMessage = 'Not enough funds to make the transaction';
      const handleToTest = Object.assign({}, handle);
      const buildObject = { txb: { tx: { ins: new Array(3), outs: new Array(30) } } };
      const controller = new AssetController(node);
      handleToTest.utxos = utxosToTest;
      controller.addressController._utxo = sinon.stub().callsArgWith(2, null, [].concat(utxosToTest));
      controller.ccBuildTypes = { issue: () => buildObject };
      controller._loadBestUtxos = () => new Promise((resolve, reject) => { reject({ message: finalMessage }); });
      controller._evaluateInputsValue = () => new Promise((resolve) => { resolve({ pass: false, valueNeeded: 130000 }); });

      it('should cycle through utxos and return insufficient funds', (done) => {
        controller._loadMinimumUtxosCycle(handleToTest)
          .then(() => {
            done('should throw not enough funds');
          })
          .catch((err) => {
            should(err.message).be.exactly(finalMessage);
            done();
          });
      });
    });
  });

  describe('_evaluateBuildTxn', () => {
    const utxosToTest = [];
    const handle = { type: 'issue' };

    describe('When "CASE: first evaluation does not need to do cycles"', () => {
      const body = {
        address: 1,
        amount: 30000,
        utxos: [],
      };
      const node = {};
      const buildObject = { txb: { tx: { ins: new Array(1), outs: new Array(30) } } };
      const handleToTest = Object.assign({}, handle, { utxos: body.utxos, body });
      const controller = new AssetController(node);
      controller.ccBuildTypes = { issue: () => buildObject };
      controller._fetchEstimateFeeRate = () => new Promise((resolve) => { resolve(100000); });
      controller._evaluateInputsValue = () => new Promise((resolve) => { resolve({ pass: true, valueNeeded: 130000 }); });

      it('should execute res.jsonp without running the cycle', (done) => {
        controller.common.handleErrors = (err) => { done(err); };
        const res = {
          jsonp: (result) => {
            should(result.txb.tx.ins.length).be.exactly(1);
            done();
          },
        };
        controller._evaluateBuildTxn(handleToTest, res);
      });
    });

    describe('When "CASE: running cycles until inputs value is enough"', () => {
      const body = {
        address: 1,
        amount: 30000,
        utxos: [],
      };
      const node = {};
      const buildObject = { txb: { tx: { ins: new Array(3), outs: new Array(30) } } };
      const handleToTest = Object.assign({}, handle, { utxos: utxosToTest, body });
      const controller = new AssetController(node);
      controller.ccBuildTypes = { issue: () => buildObject };
      controller._fetchEstimateFeeRate = () => new Promise((resolve) => { resolve(100000); });
      controller._evaluateInputsValue = () => new Promise((resolve) => { resolve({ pass: false, valueNeeded: 130000 }); });
      controller._loadMinimumUtxosCycle = () => new Promise((resolve) => { resolve(buildObject); });

      const cyclesSpy = sinon.spy(controller, '_loadMinimumUtxosCycle');

      it('should call _loadMinimumUtxosCycle before executing res.jsonp', (done) => {
        controller.common.handleErrors = (err) => { done(err); };
        const res = {
          jsonp: () => {
            should(cyclesSpy.calledOnce).be.exactly(true);
            done();
          },
        };
        controller._evaluateBuildTxn(handleToTest, res);
      });
    });

    describe('When "CASE: running cycles does NOT get enough inputs value"', () => {
      const body = {
        address: 1,
        amount: 30000,
        utxos: [],
      };
      const node = {};
      const buildObject = { txb: { tx: { ins: new Array(3), outs: new Array(30) } } };
      const handleToTest = Object.assign({}, handle, { utxos: utxosToTest, body });
      const controller = new AssetController(node);
      controller.ccBuildTypes = { issue: () => buildObject };
      controller._fetchEstimateFeeRate = () => new Promise((resolve) => { resolve(100000); });
      controller._evaluateInputsValue = () => new Promise((resolve) => { resolve({ pass: false, valueNeeded: 130000 }); });
      controller._loadMinimumUtxosCycle = () => new Promise((resolve, reject) => { reject('rejected'); });

      const cyclesSpy = sinon.spy(controller, '_loadMinimumUtxosCycle');

      it('should call ...common.handleErrors', (done) => {
        controller.common.handleErrors = (err) => {
          should(cyclesSpy.calledOnce).be.exactly(true);
          should(err).be.exactly('rejected');
          done();
        };
        const res = { jsonp: () => { done('should call error'); } };
        controller._evaluateBuildTxn(handleToTest, res);
      });
    });
  });
});
