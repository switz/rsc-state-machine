'use client';
import ShoppingCartIcon from '@heroicons/react/24/outline/ShoppingCartIcon';
import { experimental_useOptimistic as useOptimistic, useState } from 'react';
import { interpret } from 'xstate';
import shoppingMachine from './ShoppingMachine';
import { addItem, cartBack, checkoutCart, emptyCart, pay, saveInfo } from './actions';

interface Props {
  data?: any;
}

export default ({ data }: Props) => {
  const [errors, setErrors] = useState<any>([]);
  const [optimisticMachine, setOptimisticMachine] = useOptimistic(
    undefined,
    (state, action: any) => {
      const interpreter = interpret(shoppingMachine);

      interpreter.start(data);
      interpreter.send(action.action, action.data);

      const snapshot = interpreter.getSnapshot();

      interpreter.stop();

      return snapshot;
    }
  );
  const activeMachine = optimisticMachine ?? data;
  console.log(optimisticMachine?.context, data?.context);

  const cart = activeMachine?.context?.cart ?? [];

  const activeState = activeMachine?.value ?? 'idle';

  const clientAdd = async () => {
    setErrors([]);

    const id = Math.random();
    setOptimisticMachine({ action: 'ADD_TO_CART', data: { id } });
    const res = await addItem(id);

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

  return (
    <div className={optimisticMachine ? 'opacity-50' : undefined}>
      <header className="mb-6 flex w-96">
        <div className="flex">
          <ShoppingCartIcon className="h-6 w-6" />
          {cart?.length ?? 0}
        </div>
      </header>

      <div className="flex gap-4">
        <div className="w-96 ring-2 ring-white">
          <form action={clientAdd}>
            <button type="submit" disabled={activeState !== 'idle'}>
              Add to Cart
            </button>
          </form>
          <form action={clientEmpty}>
            <button type="submit" disabled={activeState !== 'idle'}>
              Empty Cart
            </button>
          </form>

          {activeMachine?.context?.cart?.map((item) => (
            <div key={item.id} className="p-2 ring-2 ring-red-500">
              Item - {item.id}
            </div>
          ))}
          {errors.length > 0 &&
            errors.map((err) => (
              <div key={err.message} className="text-red-600">
                {err.message}
              </div>
            ))}

          {activeState === 'idle' && (
            <form action={clientCheckout}>
              <button type="submit">Checkout</button>
            </form>
          )}
        </div>

        {activeState === 'enterInfo' && (
          <div className="w-96 ring-2 ring-white">
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
          <div className="w-96 ring-2 ring-white">
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
        <div className="w-96 overflow-hidden ring-2 ring-white">
          <div>
            {optimisticMachine ? 'is optimistic!' : 'is server!'} - {activeState}
          </div>
          <div>
            <pre>{JSON.stringify(activeMachine, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
