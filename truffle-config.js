const HDWalletProvider = require("@truffle/hdwallet-provider");
require('dotenv').config();

module.exports = {
       networks: {
        development: {
            host: "localhost",
            port: 8545,
            network_id: "*"
        },

        mainnet: {
            provider: function() {
                return new HDWalletProvider(
                    process.env.MNEMONIC,
                    `https://mainnet.infura.io/v3/${process.env.INFURA_ID}`
                )
            },
            network_id: 1
        },
        kovan: {

            provider: function() {
                return new HDWalletProvider(
                    process.env.MNEMONIC,
                    `wss://kovan.infura.io/ws/v3/${process.env.INFURA_ID_1}`
                )
            },

            network_id: 42,
            networkCheckTimeout: 30000,
            //confirmations: 1,
            timeoutBlocks: 10,
            skipDryRun: true,  
        },
        matic: {
            provider: () => new HDWalletProvider(process.env.MNEMONIC, `wss://polygon-mumbai.g.alchemy.com/v2/${process.env.ACHEMY_MUMBAI}`),
            network_id: 80001,
            //gas: 5000000,        
            confirmations: 1,    // # of confs to wait between deployments. (default: 0)
            timeoutBlocks: 50,  // # of blocks before a deployment times out  (minimum/default: 50)
            networkCheckTimeout: 300000, //amount of time for Truffle to wait for a response from the node when testing the provider (in milliseconds)
            skipDryRun: true     // Skip dry run before migrations? (default: false for public nets )
          },

        ropsten: {
            provider: () => new HDWalletProvider(
                process.env.MNEMONIC, 
                `wss://ropsten.infura.io/ws/v3/${process.env.INFURA_ID}`),
            network_id: 3,
            gas: 5000000,
            networkCheckTimeout: 300000,
            timeoutBlocks:10,
            skipDryRun: true
        },
        bsc: {
            provider: () => new HDWalletProvider(process.env.MNEMONIC, `https://data-seed-prebsc-1-s2.binance.org:8545`),    /// [Note]: New RPC Endpoint
            //provider: () => new HDWalletProvider(mnemonic, `https://data-seed-prebsc-2-s1.binance.org:8545`),  /// [Note]: 503 eror
            network_id: 97,
            networkCheckTimeout: 9999,
            confirmations: 10,
            timeoutBlocks: 200,
            skipDryRun: true,   
          },

          goerli: {
            provider: () => new HDWalletProvider(
                process.env.MNEMONIC, 
                //`wss://goerli.infura.io/ws/v3/${process.env.INFURA_ID}`
                `https://eth-goerli.alchemyapi.io/v2/${process.env.ALCHEMY_GOERLI}`
                ),
            network_id: 5,
            gas: 5000000,        
            confirmations: 1,    // # of confs to wait between deployments. (default: 0)
            timeoutBlocks: 50,  // # of blocks before a deployment times out  (minimum/default: 50)
            networkCheckTimeout: 300000, //amount of time for Truffle to wait for a response from the node when testing the provider (in milliseconds)
            skipDryRun: true     // Skip dry run before migrations? (default: false for public nets )
          },
      
          // cronos: {
          //   provider: new HDWalletProvider(process.env.mnemonic, "https://evm-t3.cronos.org/"), 
          //   network_id: "338",
          //   skipDryRun: true
          // },
      
    },

    compilers: {
        solc: {
            version: ">=0.4.22 <0.8.0",
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    },

    mocha: {
        reporter: 'xunit',
        reporterOptions: {
          output: 'FARM_TEST-results.xml'
        }
    },

    plugins: [
        'truffle-plugin-verify'
    ],

    api_keys: {
        etherscan: process.env.ETHERSCAN_API_KEY
    }
};
