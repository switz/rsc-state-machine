'use server';

import { revalidatePath } from 'next/cache';
import 'server-only';
import { interpret } from 'xstate';
import addToCartMachine from './ShoppingMachine';
import db from './db';

const DELAY = 3000;

const getCart = () => {
  const existingCart = db.prepare('SELECT * FROM machine where user_id = ?').get(1);

  const existingData = existingCart?.data ? JSON.parse(existingCart.data) : undefined;

  const cart = interpret(addToCartMachine);

  cart.start(existingData);

  return cart;
};

const saveCart = (cart) => {
  const data = cart.getSnapshot();

  const json = JSON.stringify(data);

  db.prepare(
    'INSERT INTO machine (user_id, data, state) VALUES (?,?,?) ON CONFLICT(user_id) DO UPDATE SET data=excluded.data, state=excluded.state'
  ).run(1, json, data.value);

  revalidatePath('/');

  return cart;
};

// server action
export const addItem = async (id: number) => {
  try {
    // artificial delay
    await sleep(DELAY);

    // get existing state machine
    const cart = getCart();

    // state machine transition
    cart.send('ADD_TO_CART', {
      id,
    });

    // random error 30% of the time
    if (Math.random() < 0.3) {
      throw new Error('Random Error');
    }

    // persist state machine to your db (in this case sqlite)
    saveCart(cart);

    // tell the client everything is ok
    return { id };
  } catch (err) {
    // this commented code would trigger an error on the server
    /*
      const cart = getCart();

      cart.send('ERROR', {
        message: 'There was an error adding to cart, please try again',
      });

      saveCart(cart);
    */

    revalidatePath('/');

    // but instead, we actually just tell the client there was
    // an error since we don't want to persist it
    return { id, error: true };
  }
};

export const emptyCart = async () => {
  await sleep(DELAY);
  const cart = getCart();

  cart.send('EMPTY_CART');

  saveCart(cart);

  // db.prepare('DELETE FROM machine where user_id = ?').run(1);

  return true;
};

export const checkoutCart = async () => {
  await sleep(DELAY);
  const cart = getCart();

  cart.send('CHECKOUT');

  saveCart(cart);

  return true;
};

export const saveInfo = async (shipping?: text) => {
  await sleep(DELAY);
  const cart = getCart();

  cart.send('SAVE', {
    shipping,
  });

  saveCart(cart);

  return true;
};

export const pay = async (billing?: text) => {
  await sleep(DELAY);
  const cart = getCart();

  cart.send('PAY', {
    billing,
  });

  saveCart(cart);

  return true;
};

export const cartBack = async () => {
  await sleep(DELAY);
  const cart = getCart();

  cart.send('BACK');

  saveCart(cart);

  return true;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
