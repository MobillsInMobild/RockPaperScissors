from web3 import Web3, HTTPProvider, middleware
from eth_abi import encode, decode

def send_transaction(w3, contract, func, account, value, *args):
    tx = contract.functions.__dict__[func](*args).build_transaction({
        'from': account.address,
        'value': value,
        'nonce': w3.eth.get_transaction_count(account.address),
        'gas': 1000000,
        'gasPrice': w3.to_wei('10', 'gwei')
    })
    signed_tx = account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    return tx_hash




if __name__ == "__main__":
    rpc_url = "https://bsc-prebsc-dataseed.bnbchain.org/"
    w3 = Web3(HTTPProvider(rpc_url))
    w3.middleware_onion.inject(middleware.geth_poa_middleware, layer=0)

    print(w3.is_connected())

    sk_banker = '0x77939c646e0fc1825e2c24d7ed9c8dd0f7140208c6043c112c7874e7827f3183'
    account_banker = w3.eth.account.from_key(sk_banker)
    print('Banker address:', account_banker.address)
    sk_player = '0x0d9b91f253487c646bfed071006776157565df922f0179c13203860dbc7c0257'
    account_player = w3.eth.account.from_key(sk_player)
    print('Player address:', account_player.address)

    contract_abi = '[{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"game_id","type":"uint256"},{"indexed":false,"internalType":"enum rockpaperscissors.GameResult","name":"result","type":"uint8"}],"name":"GameFinished","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"game_id","type":"uint256"},{"indexed":false,"internalType":"address","name":"player","type":"address"}],"name":"JoinGame","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"game_id","type":"uint256"},{"indexed":false,"internalType":"address","name":"banker","type":"address"}],"name":"NewGame","type":"event"},{"inputs":[],"name":"BET_AMOUNT","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"MAX_TIMEOUT","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"balance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"enum rockpaperscissors.bet","name":"bet_player","type":"uint8"},{"internalType":"bytes","name":"secret","type":"bytes"}],"name":"calculateCommit","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"bytes32","name":"commit_banker","type":"bytes32"}],"name":"createGame","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"deposit","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"game_id","type":"uint256"}],"name":"finishGame","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"finished_games","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"games","outputs":[{"internalType":"address","name":"banker","type":"address"},{"internalType":"address","name":"player","type":"address"},{"internalType":"bytes32","name":"commit_banker","type":"bytes32"},{"internalType":"enum rockpaperscissors.bet","name":"bet_banker","type":"uint8"},{"internalType":"enum rockpaperscissors.bet","name":"bet_player","type":"uint8"},{"internalType":"uint256","name":"bet_time","type":"uint256"},{"internalType":"enum rockpaperscissors.GameResult","name":"result","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getBalance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"game_id","type":"uint256"},{"internalType":"enum rockpaperscissors.bet","name":"bet_player","type":"uint8"}],"name":"joinGame","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"max_game_id","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"new_games","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"pending_games","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"enum rockpaperscissors.bet","name":"bet_banker","type":"uint8"},{"internalType":"bytes","name":"secret","type":"bytes"},{"internalType":"uint256","name":"game_id","type":"uint256"}],"name":"reveal","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"}]'
    contract_addr = '0x03A7F9171A30787D64188a46E708031778E3E8fE'
    contract = w3.eth.contract(address=contract_addr, abi=contract_abi)

    # # deposit
    # print(account_banker.address)
    # tx_hash = send_transaction(w3, contract, 'deposit', account_banker, int(0.001 * 1e18), )
    # print(tx_hash)
    # receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    # #print(receipt)

    # tx_hash = send_transaction(w3, contract, 'deposit', account_player, int(0.001 * 1e18), )
    # print(tx_hash)
    # receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    #print(receipt)

    # create game
    secret = encode(['string'], ['banker'])
    commit_banker = contract.functions.calculateCommit(0, secret).call()
    print(commit_banker.hex())

    tx_hash = send_transaction(w3, contract, 'createGame', account_banker, 0, commit_banker)
    print('createGame tx_hash:', tx_hash.hex())
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    event_data = receipt['logs'][0]['data']
    game_id, _ = decode(['uint256', 'address'], event_data)
    #print(receipt)

    # join game
    tx_hash = send_transaction(w3, contract, 'joinGame', account_player, 0, game_id, 2)
    print('joinGame tx_hash:', tx_hash.hex())
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    #print(receipt)

    # reveal
    tx_hash = send_transaction(w3, contract, 'reveal', account_banker, 0, 0, secret, game_id)
    print('reveal tx_hash:', tx_hash.hex())
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    #print(receipt)

    # finish game
    tx_hash = send_transaction(w3, contract, 'finishGame', account_banker, 0, game_id)
    print('finishGame tx_hash:', tx_hash.hex())
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    #print(receipt)
