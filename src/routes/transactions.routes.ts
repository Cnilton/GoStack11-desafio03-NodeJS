import { Router } from 'express';

import TransactionsRepository from '../repositories/TransactionsRepository';

import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';

import { getCustomRepository, getRepository } from 'typeorm';
import Category from '../models/Category';

import multer from 'multer';
import uploadConfig from '../config/upload';

import AppError from '../errors/AppError';

const transactionsRouter = Router();
const upload = multer(uploadConfig);

transactionsRouter.get('/', async (request, response) => {
  const transactionsRepository = getCustomRepository(TransactionsRepository);
  const categoriesRepository = getRepository(Category);

  const balance = await transactionsRepository.getBalance();

  let transactions = await transactionsRepository.find();

  let promise = transactions.map(async transaction => {
    let category = await categoriesRepository.findOne({
      where: { id: transaction.category_id },
    });
    delete transaction.category_id;
    if (category != undefined) {
      transaction.category = category;
    }
  });

  Promise.all(promise).then(() => {
    return response.json({ transactions, balance });
  });
});

transactionsRouter.post('/', async (request, response) => {
  const { title, value, type, category } = request.body;

  const createTransaction = new CreateTransactionService();
  const transaction = await createTransaction.execute({
    title,
    value,
    type,
    category,
  });

  delete transaction.category_id;

  return response.json(transaction);
});

transactionsRouter.delete('/:id', async (request, response) => {
  const { id } = request.params;

  const deleteTransaction = new DeleteTransactionService();
  await deleteTransaction.execute({
    id,
  });

  return response.status(204).send();
});

transactionsRouter.post(
  '/import',
  upload.single('file'),
  async (request, response) => {
    const importTransactionsService = new ImportTransactionsService();
    const transactions = await importTransactionsService.execute({
      fileName: request.file.filename,
    });

    return response.json(transactions);
  },
);

export default transactionsRouter;
