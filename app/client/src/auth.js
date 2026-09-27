// שמירת פרטי ההתחברות בדפדפן.
// sessionStorage ולא localStorage: ההתחברות נשמרת כל עוד הלשונית פתוחה,
// וכשסוגרים את הדפדפן המשתמש מתנתק והאפליקציה נפתחת שוב בדף הכניסה.
export function saveAuth(token, user) {
  sessionStorage.setItem("token", token);
  sessionStorage.setItem("user", JSON.stringify(user));
}

// מעדכן רק את פרטי המשתמש, בלי לגעת בטוקן (אחרי עדכון פרופיל)
export function saveUser(user) {
  sessionStorage.setItem("user", JSON.stringify(user));
}

export function getToken() {
  return sessionStorage.getItem("token");
}

export function getUser() {
  const data = sessionStorage.getItem("user");
  return data ? JSON.parse(data) : null;
}

export function logout() {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");
  localStorage.removeItem("cart");   // שלא יישאר סל של לקוח קודם באותו דפדפן
}
