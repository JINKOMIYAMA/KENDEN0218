import { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

interface CartItem {
  name: string;
  quantity: number;
  price?: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { customerInfo, items, total, paymentMethod, paymentIntentId } = req.body;

    // メール送信の設定
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // 注文確認メールを送信
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: customerInfo.email,
      subject: '【KENDEN】ご注文ありがとうございます',
      text: `
        ${customerInfo.name} 様
        
        ご注文ありがとうございます。
        
        【注文内容】
        ${items.map((item: CartItem) => `${item.name}: ${item.quantity}個`).join('\n')}
        
        合計金額: ¥${total.toLocaleString()}
        
        【お届け先情報】
        〒${customerInfo.postalCode}
        ${customerInfo.prefecture}${customerInfo.city}${customerInfo.address}
        ${customerInfo.building || ''}
        
        支払方法: ${paymentMethod === 'credit' ? 'クレジットカード' : '代金引換'}
        
        ご注文ID: ${paymentIntentId}
      `,
    });

    res.status(200).json({ message: 'Order completed successfully' });
  } catch (error) {
    console.error('Order completion error:', error);
    res.status(500).json({ error: 'Failed to process order' });
  }
}