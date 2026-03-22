import db from '../db';

export const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'get_menu',
      description: 'Get all menu items and their details like price, category, and availability.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_orders',
      description: 'Get a list of recent orders with their status, items, and total price.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of orders to return', default: 10 }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_tables',
      description: 'Get all restaurant tables and their current status (available, reserved, occupied).',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_order',
      description: 'Create a new order for a table or customer.',
      parameters: {
        type: 'object',
        properties: {
          table_number: { type: 'number' },
          customer_name: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                menu_item_id: { type: 'string' },
                menu_item_name: { type: 'string' },
                quantity: { type: 'number' },
                unit_price: { type: 'number' }
              },
              required: ['menu_item_name', 'quantity', 'unit_price']
            }
          },
          total: { type: 'number' }
        },
        required: ['items', 'total']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_order_status',
      description: 'Update the status of an existing order (e.g., to served, completed, cancelled).',
      parameters: {
        type: 'object',
        properties: {
          order_id: { type: 'string' },
          status: { type: 'string', enum: ['pending', 'preparing', 'served', 'completed', 'cancelled'] }
        },
        required: ['order_id', 'status']
      }
    }
  }
];

export async function handleToolCall(name: string, args: any, userId: string) {
  console.log(`Executing tool: ${name}`, args);

  switch (name) {
    case 'get_menu': {
      const result = await db.execute('SELECT * FROM menu_items WHERE available = 1');
      return JSON.stringify(result.rows);
    }

    case 'get_orders': {
      const limit = args.limit || 10;
      const result = await db.execute({
        sql: 'SELECT * FROM orders ORDER BY created_at DESC LIMIT ?',
        args: [limit]
      });
      return JSON.stringify(result.rows);
    }

    case 'get_tables': {
      const result = await db.execute('SELECT * FROM restaurant_tables ORDER BY number ASC');
      return JSON.stringify(result.rows);
    }

    case 'create_order': {
      const id = crypto.randomUUID();
      const { table_number, customer_name, items, total } = args;
      
      const statements = [
        {
          sql: 'INSERT INTO orders (id, table_number, customer_name, subtotal, total, created_by) VALUES (?, ?, ?, ?, ?, ?)',
          args: [id, table_number || null, customer_name || null, total, total, userId]
        },
        ...items.map((item: any) => ({
          sql: 'INSERT INTO order_items (id, order_id, menu_item_id, menu_item_name, quantity, unit_price) VALUES (?, ?, ?, ?, ?, ?)',
          args: [crypto.randomUUID(), id, item.menu_item_id || null, item.menu_item_name, item.quantity, item.unit_price]
        }))
      ];

      await db.batch(statements);
      return JSON.stringify({ success: true, order_id: id });
    }

    case 'update_order_status': {
      await db.execute({
        sql: "UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?",
        args: [args.status, args.order_id]
      });
      return JSON.stringify({ success: true });
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
