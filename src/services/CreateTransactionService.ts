import AppError from '../errors/AppError';

import TransactionsRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';
import { getRepository, getCustomRepository } from 'typeorm';
import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    // const transactionRepository = getRepository(Transaction);
    const categoryRepository = getRepository(Category);

    const balance = await transactionsRepository.getBalance();

    if (type === 'outcome' && balance.total < value) {
      throw new AppError('Outcome should not be higher than balance');
    }

    let checkCategoryExists = await categoryRepository.findOne({
      where: { title: category },
    });

    // console.log(checkCategoryExists, 'aqui');
    if (!checkCategoryExists) {
      checkCategoryExists = categoryRepository.create({
        title: category,
      });

      await categoryRepository.save(checkCategoryExists);
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category: checkCategoryExists,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
