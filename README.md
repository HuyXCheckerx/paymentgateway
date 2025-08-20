# Cryoner Payment Processor

A complete React-based cryptocurrency payment processing system for handling orders from the main Cryoner store.

## Features

- **Multi-Crypto Support**: SOL, BTC, ETH, USDT (TRC20)
- **Real-time Payment Tracking**: Automatic payment status monitoring
- **QR Code Generation**: Easy mobile wallet payments
- **Discord Integration**: Automatic order notifications
- **Admin Dashboard**: Order management and monitoring
- **Responsive Design**: Works on desktop and mobile
- **User Tracking**: IP, location, and user agent logging

## Quick Start

1. **Install Dependencies**
```bash
npm install
```

2. **Configure Environment**
```bash
cp .env.example .env
# Edit .env with your Discord webhook URL and wallet addresses
```

3. **Development**
```bash
npm run dev
```

4. **Build for Production**
```bash
npm run build
```

5. **Start Production Server**
```bash
npm start
```

## Configuration

### Discord Webhook
1. Create a Discord webhook in your server
2. Copy the webhook URL to `.env` file:
```
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN
```

### Wallet Addresses
Replace the mock wallet generation in `src/utils/cryptoUtils.js` with your actual wallet addresses:

```javascript
export const generateWalletAddress = (crypto) => {
  const addresses = {
    SOL: 'YOUR_SOLANA_WALLET_ADDRESS',
    BTC: 'YOUR_BITCOIN_WALLET_ADDRESS',
    ETH: 'YOUR_ETHEREUM_WALLET_ADDRESS',
    USDT: 'YOUR_USDT_TRC20_WALLET_ADDRESS'
  };
  return addresses[crypto];
};
```

## Integration with Main Store

Update your main Cryoner store's checkout process to redirect here:

```javascript
// In CheckoutPage.jsx
const EXTERNAL_PAYMENT_SITE = 'https://pay.cryoner.store/process';
redirectToPaymentSite(EXTERNAL_PAYMENT_SITE, orderDetails);
```

## Routes

- `/` or `/process` - Payment processor (receives order data via URL params)
- `/status/:orderId` - Order status tracking
- `/admin` - Admin dashboard for order management

## URL Parameters

The payment processor accepts these URL parameters:
- `orderId` - Unique order identifier
- `amount` - USD amount to charge
- `currency` - Crypto currency (SOL, BTC, ETH, USDT)
- `email` - Customer email (optional)
- `telegram` - Customer Telegram handle
- `timestamp` - Order creation timestamp

Example:
```
https://your-payment-site.com/process?orderId=CRY-20250820-143022-A7B9&amount=150&currency=SOL&email=user@example.com&telegram=@username
```

## Payment Flow

1. **Order Creation**: Customer completes checkout on main store
2. **Redirect**: Customer redirected to payment processor with order data
3. **Address Generation**: Unique payment address generated for order
4. **QR Code**: QR code created for mobile wallet scanning
5. **Payment Monitoring**: System monitors blockchain for payment
6. **Confirmation**: Payment confirmed and customer notified
7. **Discord Notification**: Order details sent to Discord webhook

## Security Features

- **Input Validation**: All user inputs validated and sanitized
- **Rate Limiting**: Prevents spam and abuse
- **Secure Headers**: CORS and security headers configured
- **Data Encryption**: Sensitive data properly handled

## Customization

### Styling
- Modify `src/index.css` for global styles
- Update `tailwind.config.js` for theme customization
- Edit component styles in individual files

### Payment Logic
- Update `src/utils/cryptoUtils.js` for payment processing
- Modify `src/components/PaymentProcessor.jsx` for UI changes
- Customize `src/components/Admin.jsx` for admin features

## Production Deployment

1. **Build the application**:
```bash
npm run build
```

2. **Deploy to your server** (Netlify, Vercel, VPS, etc.)

3. **Configure environment variables** on your hosting platform

4. **Update main store** with your payment processor URL

## Troubleshooting

### Common Issues

1. **Orders not appearing**: Check localStorage in browser dev tools
2. **Discord notifications not working**: Verify webhook URL in environment
3. **Payment not confirming**: Check blockchain API connections
4. **Styling issues**: Ensure Tailwind CSS is properly configured

### Development

- Use browser dev tools to inspect network requests
- Check console for JavaScript errors
- Verify environment variables are loaded correctly

## Support

For support with the Cryoner Payment Processor:
- Check the troubleshooting section above
- Review the code comments for implementation details
- Test with small amounts before going live

## License

This software is part of the Cryoner ecosystem and is provided as-is for educational and commercial use.
