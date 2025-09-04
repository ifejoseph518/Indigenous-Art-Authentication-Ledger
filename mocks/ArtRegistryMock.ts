import { Cl } from "@stacks/transactions";

type Artwork = {
  owner: string;
  title: string;
  description: string;
  culturalSignificance: string;
  origin: string;
  medium: string;
  versions: { hash: Buffer; version: number; notes: string }[];
  categories: { primary: string; tags: string[] };
  collaborators: Record<string, { role: string; permissions: string[] }>;
  royaltyShares: Record<string, { percentage: number; totalReceived: number }>;
  status: { status: string; visibility: boolean };
};

export class ArtRegistryMock {
  private artworks: Map<string, Artwork> = new Map();
  private totalRoyaltyShares: Map<string, number> = new Map();

  async registerArtwork(
    sender: string,
    artHash: Buffer,
    title: string,
    description: string,
    culturalSignificance: string,
    origin: string,
    medium: string
  ) {
    if (artHash.length !== 32) return Cl.error(Cl.uint(3));
    const hashKey = artHash.toString("hex");
    if (this.artworks.has(hashKey)) return Cl.error(Cl.uint(1));
    if (!title || !description) return Cl.error(Cl.uint(4));

    this.artworks.set(hashKey, {
      owner: sender,
      title,
      description,
      culturalSignificance,
      origin,
      medium,
      versions: [],
      categories: { primary: "", tags: [] },
      collaborators: {},
      royaltyShares: {},
      status: { status: "pending-authentication", visibility: false }
    });
    this.totalRoyaltyShares.set(hashKey, 0);
    return Cl.ok(Cl.bool(true));
  }

  async getArtworkDetails(artHash: Buffer) {
    const hashKey = artHash.toString("hex");
    const artwork = this.artworks.get(hashKey);
    if (!artwork) return undefined;
    return {
      owner: artwork.owner,
      title: artwork.title,
      description: artwork.description,
      culturalSignificance: artwork.culturalSignificance,
      origin: artwork.origin,
      medium: artwork.medium
    };
  }

  async transferOwnership(sender: string, artHash: Buffer, newOwner: string) {
    const hashKey = artHash.toString("hex");
    const artwork = this.artworks.get(hashKey);
    if (!artwork) return Cl.error(Cl.uint(5));
    if (artwork.owner !== sender) return Cl.error(Cl.uint(2));

    artwork.owner = newOwner;
    return Cl.ok(Cl.bool(true));
  }

  async addVersion(sender: string, artHash: Buffer, newHash: Buffer, version: number, notes: string) {
    const hashKey = artHash.toString("hex");
    const artwork = this.artworks.get(hashKey);
    if (!artwork) return Cl.error(Cl.uint(5));
    if (artwork.owner !== sender) return Cl.error(Cl.uint(2));
    if (artwork.versions.some(v => v.version === version)) return Cl.error(Cl.uint(1));
    if (version > 50) return Cl.error(Cl.uint(6));
    if (newHash.length !== 32) return Cl.error(Cl.uint(3));

    artwork.versions.push({ hash: newHash, version, notes });
    return Cl.ok(Cl.bool(true));
  }

  async addCategory(sender: string, artHash: Buffer, category: string, tags: string[]) {
    const hashKey = artHash.toString("hex");
    const artwork = this.artworks.get(hashKey);
    if (!artwork) return Cl.error(Cl.uint(5));
    if (artwork.owner !== sender) return Cl.error(Cl.uint(2));
    if (tags.length > 10) return Cl.error(Cl.uint(7));

    artwork.categories = { primary: category, tags };
    return Cl.ok(Cl.bool(true));
  }

  async addCollaborator(sender: string, artHash: Buffer, collaborator: string, role: string, permissions: string[]) {
    const hashKey = artHash.toString("hex");
    const artwork = this.artworks.get(hashKey);
    if (!artwork) return Cl.error(Cl.uint(5));
    if (artwork.owner !== sender) return Cl.error(Cl.uint(2));
    if (artwork.collaborators[collaborator]) return Cl.error(Cl.uint(1));

    artwork.collaborators[collaborator] = { role, permissions };
    return Cl.ok(Cl.bool(true));
  }

  async hasPermission(artHash: Buffer, collaborator: string, permission: string) {
    const hashKey = artHash.toString("hex");
    const artwork = this.artworks.get(hashKey);
    if (!artwork) return Cl.error(Cl.uint(8));
    const perms = artwork.collaborators[collaborator]?.permissions || [];
    return Cl.ok(Cl.bool(perms.includes(permission)));
  }

  async setRoyaltyShare(sender: string, artHash: Buffer, participant: string, percentage: number) {
    const hashKey = artHash.toString("hex");
    const artwork = this.artworks.get(hashKey);
    if (!artwork) return Cl.error(Cl.uint(5));
    if (artwork.owner !== sender) return Cl.error(Cl.uint(2));
    if (percentage <= 0 || percentage > 100) return Cl.error(Cl.uint(9));

    const currentTotal = this.totalRoyaltyShares.get(hashKey) || 0;
    const newTotal = currentTotal + percentage;
    if (newTotal > 100) return Cl.error(Cl.uint(10));

    artwork.royaltyShares[participant] = { percentage, totalReceived: 0 };
    this.totalRoyaltyShares.set(hashKey, newTotal);
    return Cl.ok(Cl.bool(true));
  }

  async getRoyaltyShare(artHash: Buffer, participant: string) {
    const hashKey = artHash.toString("hex");
    const artwork = this.artworks.get(hashKey);
    if (!artwork) return undefined;
    return artwork.royaltyShares[participant];
  }

  async getVersionDetails(artHash: Buffer, version: number) {
    const hashKey = artHash.toString("hex");
    const artwork = this.artworks.get(hashKey);
    if (!artwork) return undefined;
    const versionData = artwork.versions.find(v => v.version === version);
    if (!versionData) return undefined;
    return { updatedHash: versionData.hash, updateNotes: versionData.notes };
  }

  async getCategories(artHash: Buffer) {
    const hashKey = artHash.toString("hex");
    const artwork = this.artworks.get(hashKey);
    if (!artwork) return undefined;
    return { primaryCategory: artwork.categories.primary, tags: artwork.categories.tags };
  }

  async verifyOwnership(artHash: Buffer, account: string) {
    const hashKey = artHash.toString("hex");
    const artwork = this.artworks.get(hashKey);
    if (!artwork) return Cl.error(Cl.uint(5));
    if (artwork.owner !== account) return Cl.error(Cl.uint(2));
    return Cl.ok(Cl.bool(true));
  }
}