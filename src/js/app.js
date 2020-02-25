App = {
     web3Provider: null,
     contracts: {},
     account: 0x0,
     loading: false,

     init: function() {
          /*
           * Replace me...
           */

          return App.initWeb3();
     },

     initWeb3: function() {
          window.ethereum.enable()
          
          // initialize web3
          if (window.web3) {
               App.web3Provider = window.web3.currentProvider
          }
          // If no injected web3 instance is detected, fall back to Ganache
          else {
               App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545')
          }
          web3 = new Web3(App.web3Provider)
          return App.initContract()
     },

     initContract: function() {
          $.getJSON('ZombieOwnership.json', function(zombieOwnershipArtifact){
               // get the contract artifact file and use it to instantiate a truffle contract abstraction
               App.contracts.ZombieOwnership = TruffleContract(zombieOwnershipArtifact);
               // set the provider for our contract
               App.contracts.ZombieOwnership.setProvider(App.web3Provider);
               // retrieve zombies from the contract
           
               //alert("init "+App.contracts.ZombieOwnership)

               //update account info
               App.displayAccountInfo();
           
               // Listen to smart contract events
               App.listenToEvents();

               // show zombies owned by current user
               return App.reloadZombies();
           });
     },

     displayAccountInfo: function () {
          // get current account information
          web3.eth.getCoinbase(function (err, account) {
               // if there is no error
               if (err === null) {
                    //set the App object's account variable
                    App.account = account;
                    // insert the account address in the p-tag with id='account'
                    $("#account").text(account);
                    // retrieve the balance corresponding to that account
                    web3.eth.getBalance(account, function (err, balance) {
                         // if there is no error
                         if (err === null) {
                              // insert the balance in the p-tag with id='accountBalance'
                              $("#accountBalance").text(web3.fromWei(balance, "ether") + " ETH");
                         }
                    });
               }
          });     
     },
     
     reloadZombies: function () {
          
          // avoid reentry
          if (App.loading) {
               return;
          }
          
          App.loading = true;
      
          // refresh account information because the balance may have changed
          App.displayAccountInfo();
      
          // define placeholder for contract instance
          // this is done because instance is needed multiple times
          var zombieOwnershipInstance;
      
          //alert("reload zombie")
          
          App.contracts.ZombieOwnership.deployed().then(function (instance) {
               zombieOwnershipInstance = instance;
               // retrieve the zombies belonging to the current user
               return zombieOwnershipInstance.getZombiesByOwner(App.account);
          }).then(function (zombieIds) {
               // Retrieve and clear the zombie placeholder
               var zombieRow = $('#zombieRow');
               zombieRow.empty();
     
               //alert("reload " + zombieIds.length)
               // fill template for each zombie
               for (var i = 0; i < zombieIds.length; i++) {
               var zombieId = zombieIds[i];
               zombieOwnershipInstance.zombies(zombieId.toNumber()).then(function (zombie) {
                         App.displayZombie(
                              zombieId.toNumber(),
                              zombie[0],
                              zombie[1],
                              zombie[2],
                              zombie[3],
                              zombie[4],
                              zombie[5]
                         );
                    });
               }
               // hide and show the generate button
               App.displayGenerateButton(zombieIds);
               // app is done loading
               App.loading = false;
          // catch any errors that may occur
          }).catch(function (err) {
                  console.log(err.message);
                  App.loading = false;
          });
      },

     createRandomZombie: function () {
          // get information from the modal
          var _zombieName = $('#zombie_name').val();
      
          // if the name was not provided
          if (_zombieName.trim() == '') {
               // we cannot create a zombie
               return false;
          }
      
          // get the instance of the ZombieOwnership contract
          App.contracts.ZombieOwnership.deployed().then(function (instance) {
               // call the createRandomZombie function, 
               // passing the zombie name and the transaction parameters
               //alert("new zombie "+App.account)
               instance.createRandomZombie(_zombieName, {
                    from: App.account,
                    gas: 500000
               });
          // log the error if there is one
          }).then(function () {
      
          }).catch(function (error) {
               console.log(error);
          });
      },

     displayZombie: function (id, name, dna, level, readyTime, winCount, lossCount) {
          // Retrieve the zombie placeholder
          var zombieRow = $('#zombieRow');
      
          // define the price for leveling up
          // should not be hard-coded in the final version
          var etherPrice = web3.toWei(0.001, "ether");
      
          // Retrieve and fill the zombie template
          var zombieTemplate = $('#zombieTemplate');
          zombieTemplate.find('.panel-title').text(name);
          zombieTemplate.find('.zombie-id').text(id);
          zombieTemplate.find('.zombie-dna').text(dna);
          zombieTemplate.find('.zombie-level').text(level);
          zombieTemplate.find('.zombie-readyTime').text(App.convertTime(readyTime));
          zombieTemplate.find('.zombie-winCount').text(winCount);
          zombieTemplate.find('.zombie-lossCount').text(lossCount);

          zombieTemplate.find('.btn-levelup').attr('data-id', id);
          zombieTemplate.find('.btn-levelup').attr('data-value', etherPrice);

          var backgroundColor = '#'+App.randomHex(dna);
          var color = '#'+App.invertHex(backgroundColor);
          zombieTemplate.find('.panel-heading').attr('style','background-color:'+backgroundColor+';color:'+color);
          // add this new zombie to the placeholder
          zombieRow.append(zombieTemplate.html());
     },

     displayGenerateButton: function (zombieIds) {
          if (zombieIds.length > 0) {
               $(".btn-create").hide();
          } else {
               $(".btn-create").show();
          }
     },

     levelUp: function (data) {
          // retrieve the zombie data
          var _zombieId = data.getAttribute("data-id");
          var _price = parseFloat(data.getAttribute("data-value"));
      
          // call the levelUp function in the zombie contract
          App.contracts.ZombieOwnership.deployed().then(function (instance) {
               return instance.levelUp(_zombieId, {
                    from: App.account,
                    value: _price,
                    gas: 500000
              });
          // catch any occuring errors
          }).then(function () {
               //App.reloadZombies();
          }).catch(function (err) {
               console.error(err);
          });
      },

      listenToEvents: function () {
          App.contracts.ZombieOwnership.deployed().then(function (instance) {
              // watch the event
              instance.NewZombie({}, {}).watch(function (error, event) {
                    // log error if one occurs
                    if (error) {
                         console.error(error);
                    }
                    // reload the zombie list if event is triggered
                    App.reloadZombies();
              });
              instance.NewLevel({}, {}).watch(function (error, event) {
                    // log error if one occurs
                    if (error) {
                         console.error(error);
                    }
                    // reload the zombie list if event is triggered
                    App.reloadZombies();
               });
          });
      },

      randomHex: function (dna) {
          var hexString = dna.toString(16).substring(0, 6);
          return hexString;
      },

      invertHex: function (hexString) {
          var hexInt = parseInt(hexString, 16);
          var complement = 0xffffff ^ hexInt;
          return complement.toString(16);
      },

      convertTime: function (timestamp) {
          var d = new Date();
          var date = new Date(timestamp * 1000 + d.getTimezoneOffset() * 60000);
          return date;
     },
};

$(function() {
     $(window).load(function() {
          App.init();
     });
});

// placeholder for current account 
var _account;
// set the interval
setInterval(function () {
    // check for new account information and display it
    App.displayAccountInfo();
    // check if current account is still the same, if not
    if (_account != App.account) {
            // load the new zombie list
            //App.reloadZombies();
            // update the current account
            _account = App.account;
    }
}, 100);
