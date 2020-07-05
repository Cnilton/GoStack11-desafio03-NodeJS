import Transaction from '../models/Transaction';

import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from './CreateTransactionService';
import Category from '../models/Category';

import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';
import { getCustomRepository, getRepository } from 'typeorm';
import { response } from 'express';

import AppError from '../errors/AppError';

interface Request {
  fileName: string;
}

interface NewTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute({ fileName }: Request): Promise<Transaction[]> {
    // TODO
    const csvFilePath = path.resolve(__dirname, '..', '..', 'tmp', fileName);
    const readCSVStream = fs.createReadStream(csvFilePath);

    const parseStream = csvParse({
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const lines: [][] = [];

    parseCSV.on('data', line => {
      lines.push(line);
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    let transactions: NewTransaction[] = [];

    for (let i = 1; i < lines.length; i++) {
      let transaction: NewTransaction = {
        title: '',
        type: 'income',
        value: 0,
        category: '',
      };
      for (let j = 0; j < lines[0].length; j++) {
        transaction[lines[0][j]] = lines[i][j];
      }
      transactions.push(transaction);
    }

    let responseTransaction: Transaction[] = [];

    for (let i = 0; i < transactions.length; i++) {
      const transaction = await new CreateTransactionService().execute({
        title: transactions[i].title,
        value: transactions[i].value,
        type: transactions[i].type,
        category: transactions[i].category,
      });
      await responseTransaction.push(transaction);
    }

    return responseTransaction;
  }
}

export default ImportTransactionsService;
