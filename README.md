# Rock Paper Scissors implemented by Soldity

## 基础逻辑

![alt text](img/设计逻辑.png)

- 采用 Balance Map 来记录资金，由 Deposit 和 Withdraw 来实现 Token 转 Game 内数额计算；

- Banker 提供由 Bet 和 Secret 计算的 Commit，由于 Hash 的单向性，Player 无法知道 Bet，因此会 Join Game 时给出明确的 Bet；Player 给出明确的 Bet 后，如果 Banker 会输掉比赛，它不会继续给出 Bet（由于已经提交 Commit，它也无法修改原有 Bet）；所以采用了时间锁的设定，如果 Banker 没有在规定的时间内 Reveal 提交原有 Bet，则在 Finish Game 时直接判负。

## 代码说明

- `src/rockpaperscissors.sol`：合约代码实现

- `test/rockpaperscissors.t.sol`：单元测试，运行 `forge test -vvvv`

## 测试网实现

- 部署到了 BSC testnet 上，具体账户：

- banker
  - Address:     0x2EA4B59e6872ab196b52246F9DD0F10D7AEb11ec
  - Private key: 0x77939c646e0fc1825e2c24d7ed9c8dd0f7140208c6043c112c7874e7827f3183

- player
  - Address:     0x82800a833D230A5064b784BB6486F99A5e43a0C2
  - Private key: 0x0d9b91f253487c646bfed071006776157565df922f0179c13203860dbc7c0257

- Contract: [0x03a7f9171a30787d64188a46e708031778e3e8fe](https://testnet.bscscan.com/address/0x03a7f9171a30787d64188a46e708031778e3e8fe)
  - 合约已经 Verify

## 前端实现

![alt text](img/front.jpeg)

- 前端实现如图所示，完成了连接钱包、加入/查看/创建对局，以及对 Game List 和 Game Result 的按需更新功能。

- 代码在 `front\src`， `npm start` 启动运行
