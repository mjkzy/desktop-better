import { getDotComAPIEndpoint } from '../lib/api'

export type IKnownBot = {
  readonly login: string
  readonly userId: number
  readonly integrationId: number
  readonly avatarURL: string
  readonly endpoint: string
}

const dotComBot = (
  login: string,
  userId: number,
  integrationId: number
): IKnownBot => ({
  login,
  userId,
  integrationId,
  avatarURL: `https://avatars.githubusercontent.com/in/${integrationId}?v=4`,
  endpoint: getDotComAPIEndpoint(),
})

export const dependabotBot = dotComBot('dependabot[bot]', 49699333, 29110)
export const actionsBot = dotComBot('github-actions[bot]', 41898282, 15368)
export const githubPagesBot = dotComBot('github-pages[bot]', 52472962, 34598)

export const knownDotComBots: ReadonlyArray<IKnownBot> = [
  dependabotBot,
  actionsBot,
  githubPagesBot,
]
