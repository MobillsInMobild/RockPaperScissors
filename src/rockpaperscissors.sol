// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

contract rockpaperscissors{
    uint constant public BET_AMOUNT = 0.0001 ether;
    uint constant public MAX_TIMEOUT = 10 minutes;

    enum GameResult {None, Win, Lose, Draw} // for player  
    enum bet {Rock, Paper, Scissors, None}

    struct Game {
        address banker;
        address player;
        bytes32 commit_banker;
        bet bet_banker;
        bet bet_player;
        uint bet_time;
        GameResult result;
    }

    mapping(uint256 => Game) public games;
    uint256 public max_game_id = 0;
    
    uint256[] public finished_games;
    uint256[] public new_games;
    uint256[] public pending_games;

    event NewGame(uint256 game_id, address banker);
    event JoinGame(uint256 game_id, address player);
    event GameFinished(uint256 game_id, GameResult result);

    mapping(address => uint256) public balance;

    function deposit() public payable {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        balance[msg.sender] += msg.value;
    }

    function withdraw(uint256 amount) public {
        require(balance[msg.sender] >= amount, "Insufficient balance");
        require(address(this).balance >= amount, "Insufficient contract balance");
        balance[msg.sender] -= amount;
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed.");
    }

    function getBalance() public view returns (uint256) {
        return balance[msg.sender];
    }

    function findIndexInArray(uint256[] memory arr, uint256 value) private pure returns (uint256) {
        for (uint256 i = 0; i < arr.length; i++) {
            if (arr[i] == value) {
                return i;
            }
        }
        return arr.length;
    }

    function removeElementFromArray(uint256[] storage arr, uint256 value) private {
        uint256 index = findIndexInArray(arr, value);
        if (index < arr.length) {
            arr[index] = arr[arr.length - 1];
            arr.pop();
        }
    }

    function createGame(bytes32 commit_banker) public returns (uint256) {
        require(balance[msg.sender] >= BET_AMOUNT, "Insufficient balance");
        balance[msg.sender] -= BET_AMOUNT;
        max_game_id += 1;
        games[max_game_id] = Game(msg.sender, address(0), commit_banker, bet.None, bet.None, 0, GameResult.None);
        new_games.push(max_game_id);
        emit NewGame(max_game_id, msg.sender);
        return max_game_id;
    }

    function joinGame(uint256 game_id, bet bet_player) public {
        require(balance[msg.sender] >= BET_AMOUNT, "Insufficient balance");
        require(games[game_id].player == address(0), "Game is already joined");
        balance[msg.sender] -= BET_AMOUNT;
        games[game_id].player = msg.sender;
        games[game_id].bet_player = bet_player;
        games[game_id].bet_time = block.timestamp;
        pending_games.push(game_id);
        removeElementFromArray(new_games, game_id);
        emit JoinGame(game_id, msg.sender);
    }

    function calculateCommit(bet bet_player, bytes memory secret) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(bet_player, secret));
    }


    function reveal(bet bet_banker, bytes memory secret, uint256 game_id) public {
        require(games[game_id].player != address(0), "Game is not joined yet");
        require(games[game_id].result == GameResult.None, "Game is already finished");
        require(games[game_id].banker == msg.sender, "Only banker can reveal the result");
        require(block.timestamp - games[game_id].bet_time <= MAX_TIMEOUT, "Timeout");
        require(games[game_id].commit_banker == calculateCommit(bet_banker, secret), "Invalid secret");
        games[game_id].bet_banker = bet_banker;
    }

    function getGameResult(bet bet_player, bet bet_banker) private pure returns (GameResult) {
        if (bet_player == bet_banker) {
            return GameResult.Draw;
        }
        if (bet_player == bet.Rock && bet_banker == bet.Scissors) {
            return GameResult.Win;
        }
        if (bet_player == bet.Paper && bet_banker == bet.Rock) {
            return GameResult.Win;
        }
        if (bet_player == bet.Scissors && bet_banker == bet.Paper) {
            return GameResult.Win;
        }
        return GameResult.Lose;
    }

    function finishGame(uint256 game_id) public {
        require(games[game_id].result == GameResult.None, "Game is not finished yet");
        //require(games[game_id].player == msg.sender || games[game_id].banker == msg.sender, "Only player or banker can finish the game");
        GameResult result = GameResult.None;
        if ((games[game_id].bet_time + MAX_TIMEOUT < block.timestamp) && (games[game_id].bet_banker == bet.None)){
            result = GameResult.Win;
        } else {
            require(games[game_id].bet_time + MAX_TIMEOUT >= block.timestamp && games[game_id].bet_banker != bet.None, "Banker did not reveal the result");
            result = getGameResult(games[game_id].bet_player, games[game_id].bet_banker);
        }
        require(result != GameResult.None, "Invalid result");
        games[game_id].result = result;
        if (result == GameResult.Win) {
            balance[games[game_id].player] += 2 * BET_AMOUNT;
        } else if (result == GameResult.Draw) {
            balance[games[game_id].banker] += BET_AMOUNT;
            balance[games[game_id].player] += BET_AMOUNT;
        } else {
            balance[games[game_id].banker] += 2 * BET_AMOUNT;
        }
        finished_games.push(game_id);
        removeElementFromArray(pending_games, game_id);
        emit GameFinished(game_id, result);
    }
}