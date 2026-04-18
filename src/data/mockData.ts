export const MOCK_SHOPS = [
  { id: "S001", name: "Main Branch", duration: 15, createdAt: new Date().toISOString() },
  { id: "S002", name: "City Center", duration: 20, createdAt: new Date().toISOString() },
  { id: "S003", name: "North Plaza", duration: 10, createdAt: new Date().toISOString() },
];

export const MOCK_EMPLOYEES = [
  { 
    id: "EMP001", 
    name: "John Doe", 
    shopId: "S001", 
    status: true,
    intervals: [
      { checkin: "09:00:00", checkout: "12:00:00" },
      { checkin: "13:00:00", checkout: "17:00:00" }
    ]
  },
  { 
    id: "EMP002", 
    name: "Jane Smith", 
    shopId: "S001", 
    status: false,
    intervals: [
      { checkin: "08:30:00", checkout: "11:00:00" }
    ]
  },
  { 
    id: "EMP003", 
    name: "Mike Johnson", 
    shopId: "S002", 
    status: true,
    intervals: [
      { checkin: "10:00:00", checkout: "18:00:00" }
    ]
  }
];

export const MOCK_REALTIME = {
  S001: {
    EMP001: { status: true, intervals: [{ checkin: "09:00:00", checkout: "12:00:00" }, { checkin: "13:00:00", checkout: "17:00:00" }] },
    EMP002: { status: false, intervals: [{ checkin: "08:30:00", checkout: "11:00:00" }] }
  },
  S002: {
    EMP003: { status: true, intervals: [{ checkin: "10:00:00", checkout: "18:00:00" }] }
  }
};
