import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
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
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);
    const parsedTransaction = {
      title,
      value,
      type,
      category_id: category,
    };

    const balance = await transactionRepository.getBalance();

    if (type === 'outcome' && value > balance.total) {
      throw new AppError('Você não tem grana suficiente.');
    }

    const searchedCategory = await categoryRepository.findOne({
      where: { title: category },
    });

    if (!searchedCategory) {
      const newCategory = categoryRepository.create({ title: category });
      await categoryRepository.save(newCategory);

      parsedTransaction.category_id = newCategory.id;
    } else {
      parsedTransaction.category_id = searchedCategory.id;
    }

    const transaction = transactionRepository.create(parsedTransaction);
    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
