import { assign, createMachine } from 'xstate';

const shoppingMachine = createMachine(
  {
    predictableActionArguments: true,
    id: 'shoppingMachine',

    context: {
      cart: [],
      shipping: '',
      billing: '',
      error: {},
      info: {},
    },

    initial: 'idle',

    states: {
      idle: {
        on: {
          ERROR: {
            actions: ['error'],
          },
          ADD_TO_CART: {
            actions: ['clearErrors', 'addToCart'],
          },
          EMPTY_CART: {
            actions: ['clearErrors', 'emptyCart'],
          },
          DELETE_CART: {
            actions: ['clearErrors', 'emptyCart'],
          },
          CHECKOUT: {
            target: 'enterInfo',
          },
        },
      },
      enterInfo: {
        on: {
          SAVE: {
            actions: ['save'],
            target: 'enterBilling',
          },
          BACK: {
            target: 'idle',
          },
        },
      },
      enterBilling: {
        on: {
          PAY: {
            target: 'done',
          },
          BACK: {
            target: 'enterInfo',
          },
        },
      },
      done: {
        type: 'final',
        entry: ['deleteCart'],
      },
    },
  },
  {
    actions: {
      clearErrors: assign({
        error: {},
      }),
      error: assign({
        error: (ctx, event) => ({ ...event }),
      }),
      addToCart: assign({
        cart: (ctx, event) => ctx.cart.concat({ id: event.id }),
      }),
      save: assign({
        shipping: (ctx, event) => event.shipping,
      }),
      pay: assign({
        billing: (ctx, event) => event.billing,
      }),
      emptyCart: assign({
        cart: [],
      }),
      deleteCart: assign({
        cart: [],
        shipping: '',
        billing: '',
      }),
    },

    guards: {
      minQty: (ctx, event) => event.value >= 1,
    },
  }
);

export default shoppingMachine;
