import axios, { AxiosInstance } from 'axios';
import { FilterQuery } from 'mongoose';
import { api as pagerDutyApi } from '@pagerduty/pdjs';

import { INode, IWebhook, WebhookModel } from '../../models';
import { AlertTypes } from '../../types';
import { colorLog, s, is } from '../../utils';
import {
  AlertColor,
  SendMessageInput,
  PagerDutyDetails,
  IncidentLevel,
  PagerDutyServices,
} from './types';
import { EAlertTypes, IRedisEvent, IRotationParams } from '../event/types';

import env from '../../environment';

export class Service {
  private discordClient: AxiosInstance;
  private pagerDutyClient: any;

  constructor() {
    this.discordClient = axios.create({
      headers: { 'Content-Type': 'application/json' },
    });
    this.pagerDutyClient = pagerDutyApi({ token: env('PAGER_DUTY_API_KEY') });
  }

  /* ----- Discord Alerts ----- */
  sendError = async ({
    title,
    message,
    chain,
    location,
    frontend,
  }: AlertTypes.IAlertParams) => {
    colorLog(`${title}\n${message}`, 'red');
    try {
      return await this.sendDiscordMessage({
        title,
        color: AlertColor.ERROR,
        channel: await this.getWebhookUrl(chain.toUpperCase(), location, frontend),
        fields: [{ name: 'Error', value: this.trimMessage(message) }],
      });
    } catch (error) {
      console.error(error?.message);
    }
  };

  sendInfo = async (
    { title, message, chain, location, frontend }: AlertTypes.IAlertParams,
    color?: AlertColor,
  ) => {
    try {
      return await this.sendDiscordMessage({
        title,
        color: color || AlertColor.INFO,
        channel: await this.getWebhookUrl(chain.toUpperCase(), location, frontend),
        fields: [{ name: 'Info', value: this.trimMessage(message) }],
      });
    } catch (error) {
      console.error(error?.message);
    }
  };

  sendWarn = async ({
    title,
    message,
    chain,
    location,
    frontend,
  }: AlertTypes.IAlertParams) => {
    colorLog(`${title}\n${message}`, 'yellow');
    try {
      return await this.sendDiscordMessage({
        title,
        color: AlertColor.WARNING,
        channel: await this.getWebhookUrl(chain.toUpperCase(), location, frontend),
        fields: [{ name: 'Warning', value: this.trimMessage(message) }],
      });
    } catch (error) {
      console.error(error?.message);
    }
  };

  sendSuccess = async ({
    title,
    message,
    chain,
    location,
    frontend,
  }: AlertTypes.IAlertParams) => {
    try {
      colorLog(`${title}\n${message}`, 'green');
      return await this.sendDiscordMessage({
        title,
        color: AlertColor.SUCCESS,
        channel: await this.getWebhookUrl(chain.toUpperCase(), location, frontend),
        fields: [{ name: 'Success', value: this.trimMessage(message) }],
      });
    } catch (error) {
      console.error(error?.message);
    }
  };

  async sendDiscordMessage({
    title,
    color,
    fields,
    channel,
  }: SendMessageInput): Promise<boolean> {
    const embeds = [{ title, color, fields }];

    try {
      const { status } = await this.discordClient.post(channel, { embeds });
      return status === 204;
    } catch (error) {
      throw new Error(`Could not send alert to Discord. ${error}`);
    }
  }

  private async getWebhookUrl(
    chain: string,
    location: string,
    frontend = false,
  ): Promise<string> {
    let query: FilterQuery<IWebhook>;

    if (frontend) {
      query = { chain: 'FRONTEND_ALERT' };
    } else if (env('PNF') && chain === 'POKT-DIS') {
      query = { chain };
    } else {
      query = { chain, location };
    }

    const { url } = await WebhookModel.findOne(query);
    return url;
  }

  private trimMessage(message: string): string {
    if (message.length >= 1950) {
      const trimmedDisclaimer =
        "...\nMessage trimmed to not exceed Discord's character limit.";
      return message.substring(0, 1950 - trimmedDisclaimer.length) + trimmedDisclaimer;
    } else {
      return message;
    }
  }

  /* ----- Pager Duty Alert ----- */
  async createPagerDutyIncident({
    title,
    details,
    service = PagerDutyServices.CRITICAL,
    urgency = IncidentLevel.HIGH,
  }) {
    try {
      const { data } = await this.pagerDutyClient.post('/incidents', {
        data: {
          incident: {
            title,
            urgency,
            type: PagerDutyDetails.TYPE,
            service: { id: service, type: PagerDutyDetails.SERVICE_TYPE },
            body: { type: PagerDutyDetails.BODY_TYPE, details },
          },
        },
        headers: { From: PagerDutyDetails.FROM },
      });
      return data;
    } catch (error) {
      throw new Error(`Could not create PD incident. ${error}`);
    }
  }

  /* ----- Message String Methods ----- */
  getAlertMessage(
    { count, conditions, name, ethSyncing, height, details }: IRedisEvent,
    alertType: EAlertTypes,
    nodesOnline: number,
    nodesTotal: number,
    destination: string,
  ): { message: string; statusStr: string } {
    const badOracles = details?.badOracles?.join('\n');
    const noOracle = details?.noOracle;
    const nodeIsAheadOfPeer = details?.nodeIsAheadOfPeer;
    const secondsToRecover = details?.secondsToRecover;

    const statusStr = `${name} is ${conditions}.`;
    const countStr =
      alertType !== EAlertTypes.RESOLVED
        ? `This event has occurred ${count} time${s(count)} since first occurrence.`
        : '';
    const ethSyncStr = ethSyncing ? `\nETH Syncing - ${ethSyncing}\n` : '';
    const heightStr = height
      ? `Block Height - Internal: ${height.internalHeight} / External: ${height.externalHeight} / Delta: ${height.delta}`
      : '';
    const secondsToRecoverStr =
      typeof secondsToRecover === 'number'
        ? this.getSecondsToRecoverString(secondsToRecover)
        : '';
    let nodeCountStr =
      typeof nodesOnline === 'number' && nodesTotal >= 1
        ? `${nodesOnline} of ${nodesTotal} node${s(nodesTotal)} ${is(
            nodesTotal,
          )} in rotation for ${destination}.`
        : '';
    if (nodeCountStr && nodesOnline <= 1) nodeCountStr = `${nodeCountStr.toUpperCase()}`;
    const badOracleStr = badOracles?.length
      ? `\nWarning - Bad Oracle${s(badOracles.length)}\n${badOracles}`
      : '';
    const noOracleStr = noOracle
      ? `\nWarning - No Oracle for node. Node has ${details?.numPeers} peers.`
      : '';
    const nodeIsAheadOfPeerStr = nodeIsAheadOfPeer
      ? `Warning - Node is ahead of peers.\nDelta: ${nodeIsAheadOfPeer}`
      : '';

    return {
      message: [
        countStr,
        heightStr,
        secondsToRecoverStr,
        ethSyncStr,
        badOracleStr,
        noOracleStr,
        nodeCountStr,
        nodeIsAheadOfPeerStr,
      ]
        .filter(Boolean)
        .join('\n'),
      statusStr,
    };
  }

  private getSecondsToRecoverString(secondsToRecover: number): string {
    if (secondsToRecover === -1) {
      return 'Delta is increasing.';
    }
    if (secondsToRecover === 0) {
      return 'Delta is stuck.';
    }

    const minutesToRecover = Math.floor(secondsToRecover / 60);
    return `Node is syncing; the estimated time to sync is approximately ${minutesToRecover} minutes.`;
  }

  getRotationMessage(
    { backend, loadBalancers, name }: INode,
    enable: boolean,
    mode: 'success' | 'error',
    nodesOnline: number,
    nodesTotal: number,
    error?: any,
  ): { title: string; message: string } {
    const haProxyMessage = this.getHAProxyMessage({
      destination: backend,
      loadBalancers,
    });
    const title = enable
      ? {
          success: `[Added] - Successfully added ${name} to rotation`,
          error: `[Error] - Could not add ${name} to rotation`,
        }[mode]
      : {
          success: `[Removed] - Successfully removed ${name} from rotation`,
          error: `[Error] - Could not remove ${name} from rotation`,
        }[mode];
    let nodeCountStr =
      typeof nodesOnline === 'number' && nodesTotal >= 1
        ? `${nodesOnline} of ${nodesTotal} node${s(nodesTotal)} ${is(
            nodesOnline,
          )} in rotation for ${backend}.`
        : '';
    if (nodeCountStr && nodesOnline <= 1) nodeCountStr = `${nodeCountStr.toUpperCase()}`;
    const message = [haProxyMessage, nodeCountStr, error].filter(Boolean).join('\n');

    return { title, message };
  }

  getHAProxyMessage({ destination, loadBalancers }: IRotationParams): string {
    if (env('MONITOR_TEST')) return '';

    const urls = loadBalancers
      .map(({ url, ip }) => `http://${url || ip}:8050/stats?scope=${destination}`)
      .join('\n');
    return `HAProxy Status\n${urls}`;
  }

  getErrorMessage(server: string, mode: 'count' | 'error', count?: number): string {
    return {
      count: `Could not remove ${server} from load balancer. ${count} server${s(
        count,
      )} online.\nManual intervention required.`,
      error: `Could not add ${server} to load balancer due to server status check returning ERROR status.`,
    }[mode];
  }
}
