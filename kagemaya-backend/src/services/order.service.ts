import { prisma } from '../lib/prisma';

// Definisi interface untuk kustomisasi tipe objek order_items
interface OrderItemWithTicket {
  id: string;
  order_id: string;
  ticket_type_id: string;
  quantity: number;
  price: number | string | any;
  ticket_type?: {
    id: string;
    name: string;
    price: number | string | any;
  } | null;
}

export const getOrderByIdService = async (orderId: string) => {
  // Query ke database Neon via Prisma
  const order = await (prisma as any).order.findUnique({
    where: { id: orderId },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          start_date: true,
          start_time: true,
          venue_name: true,
          city: true,
          banner_url: true,
        },
      },
      order_items: {
        include: {
          ticket_type: {
            select: {
              id: true,
              name: true,
              price: true,
            },
          },
        },
      },
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      voucher: {
        select: {
          code: true,
          discount_type: true,
          discount_value: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error('ID Transaksi tidak ditemukan di database Neon.');
  }

  // Format ulang payload agar konsisten dengan kebutuhan UI Payment Page
  return {
    id: order.id,
    status: order.status,
    total_amount: Number(order.total_amount || 0),
    subtotal: Number(order.subtotal || 0),
    service_fee: Number(order.service_fee || 0),
    voucher_discount: Number(order.voucher_discount || 0),
    points_discount: Number(order.points_discount || 0),
    created_at: order.created_at,
    event_title: order.event?.title || 'Event',
    event_date: order.event?.start_date,
    event_time: order.event?.start_time,
    event_location: order.event?.venue_name || order.event?.city || 'Online',
    tickets: (order.order_items || []).map((item: OrderItemWithTicket) => ({
      ticket_id: item.ticket_type_id,
      name: item.ticket_type?.name || 'Tiket',
      price: Number(item.price || item.ticket_type?.price || 0),
      quantity: item.quantity,
    })),
  };
};