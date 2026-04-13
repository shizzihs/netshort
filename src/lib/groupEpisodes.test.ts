import { describe, it, expect } from "vitest"
import { groupEpisodes } from "./groupEpisodes"
import type { EpisodeInfo } from "@/types"

function makeEpisodes(count: number): EpisodeInfo[] {
  return Array.from({ length: count }, (_, i) => ({
    episodeId: `ep-${i + 1}`,
    episodeNo: i + 1,
    isLock: false,
  }))
}

describe("groupEpisodes", () => {
  it("returns empty array for empty input", () => {
    expect(groupEpisodes([])).toEqual([])
  })

  it("returns 1 group for <30 episodes", () => {
    const episodes = makeEpisodes(10)
    const groups = groupEpisodes(episodes)
    expect(groups).toHaveLength(1)
    expect(groups[0].label).toBe("1\u201310")
    expect(groups[0].startNo).toBe(1)
    expect(groups[0].endNo).toBe(10)
    expect(groups[0].episodes).toHaveLength(10)
  })

  it("returns 1 group for exactly 30 episodes", () => {
    const episodes = makeEpisodes(30)
    const groups = groupEpisodes(episodes)
    expect(groups).toHaveLength(1)
    expect(groups[0].label).toBe("1\u201330")
    expect(groups[0].startNo).toBe(1)
    expect(groups[0].endNo).toBe(30)
  })

  it("returns 2 groups for 31 episodes", () => {
    const episodes = makeEpisodes(31)
    const groups = groupEpisodes(episodes)
    expect(groups).toHaveLength(2)
    expect(groups[0].label).toBe("1\u201330")
    expect(groups[0].episodes).toHaveLength(30)
    expect(groups[1].label).toBe("31\u201331")
    expect(groups[1].episodes).toHaveLength(1)
  })

  it("returns 3 groups for 90 episodes", () => {
    const episodes = makeEpisodes(90)
    const groups = groupEpisodes(episodes)
    expect(groups).toHaveLength(3)
    expect(groups[0].label).toBe("1\u201330")
    expect(groups[1].label).toBe("31\u201360")
    expect(groups[2].label).toBe("61\u201390")
    groups.forEach((g) => expect(g.episodes).toHaveLength(30))
  })

  it("uses custom groupSize", () => {
    const episodes = makeEpisodes(20)
    const groups = groupEpisodes(episodes, 10)
    expect(groups).toHaveLength(2)
    expect(groups[0].label).toBe("1\u201310")
    expect(groups[1].label).toBe("11\u201320")
  })

  it("uses em dash (U+2013) not hyphen in labels", () => {
    const groups = groupEpisodes(makeEpisodes(5))
    expect(groups[0].label).toContain("\u2013")
    expect(groups[0].label).not.toContain("-")
  })
})
