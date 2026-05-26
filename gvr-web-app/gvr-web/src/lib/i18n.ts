export const i18n = {
  en: {
    appName: 'Green Village Rice',
    tagline: 'Farm-fresh Sona Masoori, delivered',
    nav: { home: 'Home', orders: 'Orders', inventory: 'Inventory', customers: 'Customers', analytics: 'Analytics', shop: 'Shop', myOrders: 'My Orders', profile: 'Profile', deliveries: 'Deliveries' },
    auth: { login: 'Login', phone: 'Mobile Number', sendOTP: 'Send OTP', enterOTP: 'Enter OTP', verify: 'Verify & Login', resend: 'Resend OTP', welcome: 'Welcome back', subtitle: 'Enter your mobile number to continue' },
    dashboard: { greeting: 'Good morning', revenue: "Today's Revenue", orders: 'Orders', stockAlert: 'Stock Alert', deliveries: 'Deliveries', weeklySales: 'Weekly Sales', recentOrders: 'Recent Orders', lowStock: 'Low Stock Alert' },
    orders: { title: 'Orders', new: 'New Order', confirm: 'Confirm', assign: 'Assign Delivery', invoice: 'Invoice', track: 'Track', status: { pending: 'Pending', confirmed: 'Confirmed', packed: 'Packed', dispatched: 'In Transit', delivered: 'Delivered', cancelled: 'Cancelled' } },
    inventory: { title: 'Inventory', addStock: 'Add Stock', stockLevel: 'Stock Level', bagsLeft: 'bags left', packingDate: 'Packing Date', bestBefore: 'Best Before', lowStock: 'Low stock' },
    shop: { title: 'Order Rice', addToCart: 'Add', checkout: 'Checkout', total: 'Total', qty: 'Quantity', payUPI: 'Pay via UPI', payCOD: 'Cash on Delivery', address: 'Delivery Address', placeOrder: 'Place Order', freshNote: 'Freshly milled' },
    delivery: { title: 'My Deliveries', markDelivered: 'Mark Delivered', call: 'Call', navigate: 'Navigate', onWay: 'On the Way', pickup: 'For Pickup' },
    profile: { title: 'My Profile', edit: 'Edit Profile', logout: 'Logout', language: 'Language', addresses: 'Saved Addresses' },
    common: { save: 'Save', cancel: 'Cancel', loading: 'Loading…', error: 'Something went wrong', noData: 'No data found', search: 'Search', filter: 'Filter', all: 'All', today: 'Today', thisWeek: 'This week', thisMonth: 'This month' },
  },
  te: {
    appName: 'గ్రీన్ విలేజ్ రైస్',
    tagline: 'తాజా సోనా మసూరి, డెలివరీ',
    nav: { home: 'హోమ్', orders: 'ఆర్డర్లు', inventory: 'స్టాక్', customers: 'కస్టమర్లు', analytics: 'రిపోర్ట్', shop: 'షాప్', myOrders: 'నా ఆర్డర్లు', profile: 'ప్రొఫైల్', deliveries: 'డెలివరీలు' },
    auth: { login: 'లాగిన్', phone: 'మొబైల్ నంబర్', sendOTP: 'OTP పంపండి', enterOTP: 'OTP నమోదు చేయండి', verify: 'ధృవీకరించు', resend: 'OTP మళ్ళీ పంపండి', welcome: 'స్వాగతం', subtitle: 'కొనసాగించడానికి మీ ఫోన్ నంబర్ నమోదు చేయండి' },
    dashboard: { greeting: 'శుభోదయం', revenue: 'నేటి ఆదాయం', orders: 'ఆర్డర్లు', stockAlert: 'స్టాక్ హెచ్చరిక', deliveries: 'డెలివరీలు', weeklySales: 'వారపు అమ్మకాలు', recentOrders: 'తాజా ఆర్డర్లు', lowStock: 'తక్కువ స్టాక్' },
    orders: { title: 'ఆర్డర్లు', new: 'కొత్త ఆర్డర్', confirm: 'నిర్ధారించు', assign: 'డెలివరీ అసైన్', invoice: 'ఇన్వాయిస్', track: 'ట్రాక్', status: { pending: 'పెండింగ్', confirmed: 'నిర్ధారించబడింది', packed: 'ప్యాక్', dispatched: 'రవాణాలో', delivered: 'డెలివరీ అయింది', cancelled: 'రద్దు' } },
    inventory: { title: 'స్టాక్', addStock: 'స్టాక్ జోడించు', stockLevel: 'స్టాక్ స్థాయి', bagsLeft: 'బ్యాగ్లు', packingDate: 'ప్యాకింగ్ తేదీ', bestBefore: 'వాడే తేదీ', lowStock: 'తక్కువ స్టాక్' },
    shop: { title: 'బియ్యం ఆర్డర్', addToCart: 'జోడించు', checkout: 'చెక్‌అవుట్', total: 'మొత్తం', qty: 'పరిమాణం', payUPI: 'UPI ద్వారా', payCOD: 'డెలివరీలో నగదు', address: 'డెలివరీ చిరునామా', placeOrder: 'ఆర్డర్ చేయండి', freshNote: 'తాజాగా మిల్లింగ్ చేయబడింది' },
    delivery: { title: 'నా డెలివరీలు', markDelivered: 'డెలివరీ అయినట్లు', call: 'కాల్', navigate: 'నావిగేట్', onWay: 'మార్గంలో', pickup: 'పికప్' },
    profile: { title: 'నా ప్రొఫైల్', edit: 'సవరించు', logout: 'లాగ్ అవుట్', language: 'భాష', addresses: 'చిరునామాలు' },
    common: { save: 'సేవ్', cancel: 'రద్దు', loading: 'లోడ్ అవుతోంది…', error: 'ఏదో తప్పు జరిగింది', noData: 'డేటా లేదు', search: 'వెతకండి', filter: 'ఫిల్టర్', all: 'అన్నీ', today: 'నేడు', thisWeek: 'ఈ వారం', thisMonth: 'ఈ నెల' },
  },
}

export type Lang = 'en' | 'te'
export type T = typeof i18n.en

export function useT(lang: Lang): T {
  return i18n[lang] as T
}
