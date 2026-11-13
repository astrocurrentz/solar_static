import type { APIRoute } from 'astro';
import { freewillPath } from '../../data/tool-routes';

export const prerender = false;

export const GET: APIRoute = ({ redirect, url }) =>
  redirect(freewillPath + url.search, 308);
