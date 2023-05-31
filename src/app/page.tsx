import Cart from './Cart';

import db from './db';

export default function Home() {
  const machine = db.prepare('SELECT * FROM machine where user_id = ?').get(1);

  const data = machine?.data ? JSON.parse(machine?.data) : undefined;

  return (
    <div className="p-2">
      <Cart data={data} />
    </div>
  );
}
