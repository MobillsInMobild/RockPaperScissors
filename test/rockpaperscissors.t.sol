// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/rockpaperscissors.sol";

contract rockpaperscissorsTest is Test {
    rockpaperscissors rps;
    address addr_testFund;
    address addr_banker;
    address addr_player;
    function setUp() public {
        rps = new rockpaperscissors();
        addr_testFund = makeAddr('testFund');
        addr_banker = makeAddr('banker');
        addr_player = makeAddr('player');
    }

    function testFund() public {
        startHoax(addr_testFund, 1e18);
        rps.deposit{value: 0.3 ether}();
        assertEq(addr_testFund.balance, 0.7 ether);
        assertEq(rps.getBalance(), 0.3 ether);
        rps.withdraw(0.3 ether);
        assertEq(addr_testFund.balance, 1 ether);
        assertEq(rps.getBalance(), 0 ether);
    }

    function testPlayWin() public {
        // create game
        startHoax(addr_banker);
        rps.deposit{value: 1 ether}();
        bytes32 commit_banker = rps.calculateCommit(rockpaperscissors.bet.Rock, abi.encode('banker')); 
        console.logBytes32(commit_banker);
        uint256 game_id = rps.createGame(commit_banker);

        // join game
        startHoax(addr_player);
        rps.deposit{value: 1 ether}();
        rps.joinGame(game_id, rockpaperscissors.bet.Paper);
        console.log(rps.balance(addr_banker), rps.balance(addr_player));

        // reveal
        startHoax(addr_banker);
        rps.reveal(rockpaperscissors.bet.Rock, abi.encode('banker'), game_id);

        // finish game
        rps.finishGame(game_id);
        console.log(rps.balance(addr_banker), rps.balance(addr_player));
    }

    function testPlayDraw() public {
        // create game
        startHoax(addr_banker);
        rps.deposit{value: 1 ether}();
        bytes32 commit_banker = rps.calculateCommit(rockpaperscissors.bet.Rock, abi.encode('banker')); 
        console.logBytes32(commit_banker);
        uint256 game_id = rps.createGame(commit_banker);

        // join game
        startHoax(addr_player);
        rps.deposit{value: 1 ether}();
        rps.joinGame(game_id, rockpaperscissors.bet.Rock);
        console.log(rps.balance(addr_banker), rps.balance(addr_player));

        // reveal
        startHoax(addr_banker);
        rps.reveal(rockpaperscissors.bet.Rock, abi.encode('banker'), game_id);

        // finish game
        rps.finishGame(game_id);
        console.log(rps.balance(addr_banker), rps.balance(addr_player));
    }

    function testPlayTimeout() public {
        // create game
        startHoax(addr_banker);
        rps.deposit{value: 1 ether}();
        bytes32 commit_banker = rps.calculateCommit(rockpaperscissors.bet.Rock, abi.encode('banker')); 
        console.logBytes32(commit_banker);
        uint256 game_id = rps.createGame(commit_banker);

        // join game
        startHoax(addr_player);
        rps.deposit{value: 1 ether}();
        rps.joinGame(game_id, rockpaperscissors.bet.Rock);
        console.log(rps.balance(addr_banker), rps.balance(addr_player));

        // Timeout
        skip(61);

        // finish game
        rps.finishGame(game_id);
        console.log(rps.balance(addr_banker), rps.balance(addr_player));
    }


}
