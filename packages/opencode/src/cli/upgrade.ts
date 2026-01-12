import { Bus } from "@/bus"
import { Config } from "@/config/config"
import { Flag } from "@/flag/flag"
import { Installation } from "@/installation"

function baseVersion(version: string) {
  const match = version.match(/^\d+\.\d+\.\d+/)
  if (!match) return version
  return match[0]
}

export async function upgrade() {
  const config = await Config.global()
  const method = await Installation.method()
  const latest = await Installation.latest(method).catch(() => {})
  if (!latest) return

  const currentBase = baseVersion(Installation.VERSION)
  const latestBase = baseVersion(latest)
  if (currentBase === latestBase) return

  if (config.autoupdate === false || Flag.OPENCODE_DISABLE_AUTOUPDATE) {
    return
  }
  if (config.autoupdate === "notify") {
    await Bus.publish(Installation.Event.UpdateAvailable, { version: latest })
    return
  }

  if (method === "unknown") return
  await Installation.upgrade(method, latest)
    .then(() => Bus.publish(Installation.Event.Updated, { version: latest }))
    .catch(() => {})
}
