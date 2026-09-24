// שמירת פרטי ההתחברות בדפדפן
export function saveAuth(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

// מעדכן רק את פרטי המשתמש, בלי לגעת בטוקן (אחרי עדכון פרופיל)
export function saveUser(user) {
  localStorage.setItem("user", JSON.stringify(user));
}

export function getUser() {
  const data = localStorage.getItem("user");
  return data ? JSON.parse(data) : null;
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}
