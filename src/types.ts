/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Window {
  id: string;
  title: string;
  icon: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
}

export interface FileItem {
  id: string;
  name: string;
  content: string;
  type: 'text' | 'paint' | 'audio' | 'link';
  modifiedAt: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: string;
  thought?: string | null;
  sources?: { title: string; uri: string }[] | null;
}

export type WallpaperType = 'abstract' | 'glass' | 'cosmic' | 'matrix' | 'solid';

export interface UserSettings {
  wallpaper: string;
  wallpaperType: WallpaperType;
  accentColor: string;
  textScale: 'sm' | 'base' | 'lg';
  soundEnabled: boolean;
  username: string;
  isLoggedIn: boolean;
  darkMode?: boolean;
}
