// import the contract artifact
const ZombieFeeding = artifacts.require('./ZombieFeeding.sol')
const truffleAssert = require('truffle-assertions')

// test starts here
contract('ZombieFeeding', function (accounts) {
  let ZombieCreateInstance
  let Zombie
  // before each test, create a new contract instance
  beforeEach(async function () {
    ZombieFeedingInstance = await ZombieFeeding.new()
  })

  it('feed a zombie to create a new one', async function () {
    let zombieId
    let newZombieDna;

    let tx1 = await ZombieFeedingInstance.createRandomZombie("Z1", { 'from': accounts[0] })
    truffleAssert.eventEmitted(tx1, 'NewZombie', (ev) => {
        zombieId = ev.zombieId
        return zombieId === ev.zombieId;
    });

    // Test that new zombie 'NoName' is created
    let tx2 = await ZombieFeedingInstance.feedAndMultiply(zombieId,10, "kitty", { 'from': accounts[0] })
    truffleAssert.eventEmitted(tx2, 'NewZombie', (ev) => {
        newZombieDna=ev.dna.toString();
        return ev.name === "NoName";
    });
    
    // Test that dna is kitty strain i.e calculated correctly
    assert.equal(newZombieDna.substr(newZombieDna.length - 2), "99", "dna strain is from a kitty")
 
    // Test that cannot eat again since there is cooldown
    await truffleAssert.reverts(ZombieFeedingInstance.feedAndMultiply(zombieId,10, "kitty", { 'from': accounts[0] }))
  })
})