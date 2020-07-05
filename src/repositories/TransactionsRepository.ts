import { EntityRepository, Repository, getRepository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    // TODO
    let balance: Balance = { income: 0, outcome: 0, total: 0 };
    const transactionsRepository = getRepository(Transaction);
    const transactions = await transactionsRepository.find();

    transactions.map(transaction => {
      transaction.type === 'income'
        ? (balance.income += transaction.value)
        : (balance.outcome += transaction.value);
    });

    balance.total = balance.income - balance.outcome;

    return balance;
  }
}

export default TransactionsRepository;
