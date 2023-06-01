'use client';
import { AnimatePresence, motion } from 'framer-motion';
import ShoppingCartIcon from '@heroicons/react/24/outline/ShoppingCartIcon';
import { experimental_useOptimistic as useOptimistic, useRef, useState } from 'react';
import { interpret } from 'xstate';
import shoppingMachine from './ShoppingMachine';
import { addItem, cartBack, checkoutCart, emptyCart, pay, saveInfo } from './actions';
import clsx from 'clsx';

interface Props {
  data?: any;
}

const items = ['shoes', 'backpack', 'tv', 'washcloth', 'soap', 'cheese'];

const randomItem = () => items[Math.floor(Math.random() * items.length)];

export default ({ data }: Props) => {
  const [errors, setErrors] = useState<any>([]);
  const [optimisticMachine, setOptimisticMachine] = useOptimistic(
    undefined,
    (state, action: any) => {
      const interpreter = interpret(shoppingMachine);

      interpreter.start(state ?? data);

      interpreter.send(action.action, { ...action.data, isOptimistic: true });

      const snapshot = interpreter.getSnapshot();

      interpreter.stop();

      return snapshot;
    }
  );
  const activeMachine = optimisticMachine ?? data;

  const cart = activeMachine?.context?.cart ?? [];

  const activeState = activeMachine?.value ?? 'idle';

  const clientAdd = async () => {
    setErrors([]);

    const item = { id: Math.random(), name: randomItem() };

    setOptimisticMachine({ action: 'ADD_TO_CART', data: item });
    const res = await addItem(item);

    if (res?.error) {
      setErrors([{ message: 'There was an error adding to cart' }]);
    }
  };

  const clientEmpty = async () => {
    setOptimisticMachine({ action: 'EMPTY_CART' });
    await emptyCart();
  };

  const clientCheckout = async () => {
    setOptimisticMachine({ action: 'CHECKOUT' });
    await checkoutCart();
  };

  const clientSaveInfo = async (formData) => {
    const shipping = formData.get('shipping');
    setOptimisticMachine({ action: 'SAVE', data: { shipping } });
    await saveInfo(shipping);
  };

  const clientPay = async (formData) => {
    const billing = formData.get('billing');
    setOptimisticMachine({ action: 'PAY' });
    await pay(billing);
  };

  const clientBack = async () => {
    setOptimisticMachine({ action: 'BACK' });
    await cartBack();
  };

  const opacity = optimisticMachine ? 'opacity-50' : undefined;

  return (
    <div>
      <header className="mb-6 flex w-full gap-4">
        <div
          className={clsx('flex', {
            'text-orange-400': !!optimisticMachine,
            'text-green-400': !optimisticMachine,
          })}
        >
          <ShoppingCartIcon className="h-6 w-6" />
          {cart?.length ?? 0}
        </div>
        <div className="text-slate-400">current state: {activeState}</div>
        <div
          className={clsx({
            'text-orange-400': !!optimisticMachine,
            'text-green-400': !optimisticMachine,
          })}
        >
          data source: {optimisticMachine ? 'optimistic client' : 'raw server data'}
        </div>
      </header>

      <div className="flex gap-4">
        <div className="flex w-96 flex-col gap-2 p-4 ring-2 ring-white">
          <form action={clientAdd} className={opacity}>
            <button type="submit" disabled={activeState !== 'idle'}>
              Add to Cart
            </button>
          </form>
          <form action={clientEmpty} className={opacity}>
            <button type="submit" disabled={activeState !== 'idle'}>
              Empty Cart
            </button>
          </form>

          <AnimatePresence initial={false}>
            {activeMachine?.context?.cart?.map((item) => (
              <motion.div
                key={item.id}
                className={clsx('p-2 ring-2', {
                  'ring-green-400': !item.isOptimistic,
                  'ring-orange-400': item.isOptimistic,
                })}
                // initial={{ y: -40 }}
                // animate={{ y: 0 }}
                layout
              >
                {item.name}
              </motion.div>
            ))}
          </AnimatePresence>
          {errors.length > 0 &&
            errors.map((err) => (
              <div key={err.message} className="text-red-600">
                {err.message}
              </div>
            ))}

          {activeState === 'idle' && (
            <form action={clientCheckout}>
              <button type="submit">Checkout -&gt;</button>
            </form>
          )}
        </div>

        {activeState === 'enterInfo' && (
          <div className="w-96 p-4 ring-2 ring-white">
            <h3>Enter your Shipping info</h3>

            <form action={clientSaveInfo}>
              <input name="shipping" defaultValue={activeMachine?.context?.shipping ?? ''} />
              <br />
              <button type="submit">Save</button>
            </form>

            <form action={clientBack}>
              <button type="submit">Back</button>
            </form>
          </div>
        )}
        {activeState === 'enterBilling' && (
          <div className="w-96 p-4 ring-2 ring-white">
            <h3>Enter your Billing info</h3>

            <form action={clientPay}>
              <input name="billing" defaultValue={activeMachine?.context?.billing ?? ''} />
              <br />
              <button type="submit">Pay</button>
            </form>
            <form action={clientBack}>
              <button type="submit">Back</button>
            </form>
          </div>
        )}
        <div className="w-96 overflow-hidden p-4 text-slate-500 ring-2 ring-slate-500">
          <div>
            <pre>{JSON.stringify(activeMachine, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
