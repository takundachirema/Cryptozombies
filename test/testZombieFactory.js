// import the contract artifact
const ZombieFactory = artifacts.require('./ZombieFactory.sol')
const truffleAssert = require('truffle-assertions')

// test starts here
contract('ZombieFactory', function (accounts) {
  // predefine the contract instance
  let ZombieFactoryInstance

  // before each test, create a new contract instance
  beforeEach(async function () {
    ZombieFactoryInstance = await ZombieFactory.new()
  })

  it('one zombie should be created per address', async function () {
    await ZombieFactoryInstance.createRandomZombie("Z1", { 'from': accounts[0] })
    await truffleAssert.reverts(ZombieFactoryInstance.createRandomZombie("Z2", { 'from': accounts[0] }))
  })

})