// src/utils/storage.js

const FAVORITES_KEY = 'prompeii_favorites';

export function saveFavorite(id) {
  let favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];

  if (favorites.includes(id)) {
    favorites = favorites.filter(fav => fav !== id);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    return false; // removed
  } else {
    favorites.push(id);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    return true; // added
  }
}

export function isFavorite(id) {
  const favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
  return favorites.includes(id);
}

export function getFavorites() {
  return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
}
