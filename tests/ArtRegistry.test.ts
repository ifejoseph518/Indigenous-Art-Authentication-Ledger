import { describe, it, expect, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";
import { ArtRegistryMock } from "../mocks/ArtRegistryMock";

const accounts = {
  deployer: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  owner: "ST2J9EVYHPYFPJW8P9J7RZ7Y9T8E2ZZ0Q8E9Q6K8M",
  collaborator: "ST3AM1A2B3C4D5E6F7G8H9J0KLMNOPQRSTUVWXYYZ",
  nonOwner: "ST1J2EVYHPYFPJW8P9J7RZ7Y9T8E2ZZ0Q8E9Q6AAA",
};

describe("ArtRegistry Contract", () => {
  let contract: ArtRegistryMock;

  beforeEach(() => {
    contract = new ArtRegistryMock();
  });

  it("should register a new artwork successfully", async () => {
    const hash = Buffer.from("hash001".padEnd(32, "0"));
    const result = await contract.registerArtwork(
      accounts.owner,
      hash,
      "Sacred Painting",
      "Traditional indigenous art",
      "Cultural artifact from tribe X",
      "Tribe X",
      "Acrylic on canvas"
    );
    expect(result).toEqual(Cl.ok(Cl.bool(true)));

    const details = await contract.getArtworkDetails(hash);
    expect(details).toBeDefined();
    expect(details?.title).toEqual("Sacred Painting");
    expect(details?.owner).toEqual(accounts.owner);
  });

  it("should prevent duplicate artwork registration", async () => {
    const hash = Buffer.from("hash002".padEnd(32, "0"));
    await contract.registerArtwork(
      accounts.owner,
      hash,
      "Sculpture",
      "Wooden carving",
      "Represents tribal unity",
      "Tribe Y",
      "Wood"
    );
    const result = await contract.registerArtwork(
      accounts.owner,
      hash,
      "Duplicate",
      "Attempted duplicate",
      "Should fail",
      "Tribe Y",
      "Wood"
    );
    expect(result).toEqual(Cl.error(Cl.uint(1)));
  });

  it("should prevent registration with invalid hash", async () => {
    const result = await contract.registerArtwork(
      accounts.owner,
      Buffer.from(""),
      "Invalid Art",
      "Should fail",
      "Invalid test",
      "Tribe Z",
      "Clay"
    );
    expect(result).toEqual(Cl.error(Cl.uint(3)));
  });

  it("should allow ownership transfer by owner", async () => {
    const hash = Buffer.from("hash003".padEnd(32, "0"));
    await contract.registerArtwork(
      accounts.owner,
      hash,
      "Totem Pole",
      "Ceremonial totem",
      "Spiritual significance",
      "Tribe A",
      "Cedar"
    );
    const result = await contract.transferOwnership(
      accounts.owner,
      hash,
      accounts.collaborator
    );
    expect(result).toEqual(Cl.ok(Cl.bool(true)));

    const details = await contract.getArtworkDetails(hash);
    expect(details?.owner).toEqual(accounts.collaborator);
  });

  it("should prevent ownership transfer by non-owner", async () => {
    const hash = Buffer.from("hash004".padEnd(32, "0"));
    await contract.registerArtwork(
      accounts.owner,
      hash,
      "Beadwork",
      "Traditional bead art",
      "Cultural heritage",
      "Tribe B",
      "Beads"
    );
    const result = await contract.transferOwnership(
      accounts.nonOwner,
      hash,
      accounts.collaborator
    );
    expect(result).toEqual(Cl.error(Cl.uint(2)));
  });

  it("should add a new version successfully", async () => {
    const hash = Buffer.from("hash005".padEnd(32, "0"));
    const newHash = Buffer.from("hash005v2".padEnd(32, "0"));
    await contract.registerArtwork(
      accounts.owner,
      hash,
      "Restored Painting",
      "Restored artwork",
      "Restored tribal art",
      "Tribe C",
      "Oil"
    );
    const result = await contract.addVersion(
      accounts.owner,
      hash,
      newHash,
      1,
      "Restoration completed"
    );
    expect(result).toEqual(Cl.ok(Cl.bool(true)));

    const versionDetails = await contract.getVersionDetails(hash, 1);
    expect(versionDetails?.updatedHash).toEqual(newHash);
  });

  it("should prevent adding version by non-owner", async () => {
    const hash = Buffer.from("hash006".padEnd(32, "0"));
    const newHash = Buffer.from("hash006v2".padEnd(32, "0"));
    await contract.registerArtwork(
      accounts.owner,
      hash,
      "Protected Art",
      "Original artwork",
      "Cultural piece",
      "Tribe D",
      "Canvas"
    );
    const result = await contract.addVersion(
      accounts.nonOwner,
      hash,
      newHash,
      1,
      "Unauthorized update"
    );
    expect(result).toEqual(Cl.error(Cl.uint(2)));
  });

  it("should add categories successfully", async () => {
    const hash = Buffer.from("hash007".padEnd(32, "0"));
    await contract.registerArtwork(
      accounts.owner,
      hash,
      "Ceremonial Mask",
      "Traditional mask",
      "Ritual use",
      "Tribe E",
      "Wood"
    );
    const result = await contract.addCategory(
      accounts.owner,
      hash,
      "Ceremonial",
      ["mask", "ritual", "tribal"]
    );
    expect(result).toEqual(Cl.ok(Cl.bool(true)));

    const categories = await contract.getCategories(hash);
    expect(categories?.primaryCategory).toEqual("Ceremonial");
    expect(categories?.tags).toEqual(["mask", "ritual", "tribal"]);
  });

  it("should prevent adding too many tags", async () => {
    const hash = Buffer.from("hash008".padEnd(32, "0"));
    await contract.registerArtwork(
      accounts.owner,
      hash,
      "OverTagged Art",
      "Test artwork",
      "Cultural test",
      "Tribe F",
      "Clay"
    );
    const tooManyTags = Array(11).fill("tag");
    const result = await contract.addCategory(
      accounts.owner,
      hash,
      "Test",
      tooManyTags
    );
    expect(result).toEqual(Cl.error(Cl.uint(7)));
  });

  it("should add collaborator successfully", async () => {
    const hash = Buffer.from("hash009".padEnd(32, "0"));
    await contract.registerArtwork(
      accounts.owner,
      hash,
      "Collaborative Art",
      "Community project",
      "Cultural collaboration",
      "Tribe G",
      "Textile"
    );
    const result = await contract.addCollaborator(
      accounts.owner,
      hash,
      accounts.collaborator,
      "authenticator",
      ["verify-authenticity", "edit-metadata"]
    );
    expect(result).toEqual(Cl.ok(Cl.bool(true)));

    const permissionResult = await contract.hasPermission(
      hash,
      accounts.collaborator,
      "verify-authenticity"
    );
    expect(permissionResult).toEqual(Cl.ok(Cl.bool(true)));
  });

  it("should set royalty share successfully", async () => {
    const hash = Buffer.from("hash010".padEnd(32, "0"));
    await contract.registerArtwork(
      accounts.owner,
      hash,
      "Royalty Art",
      "Revenue generating art",
      "Cultural revenue",
      "Tribe H",
      "Stone"
    );
    const result = await contract.setRoyaltyShare(
      accounts.owner,
      hash,
      accounts.collaborator,
      50
    );
    expect(result).toEqual(Cl.ok(Cl.bool(true)));

    const share = await contract.getRoyaltyShare(hash, accounts.collaborator);
    expect(share?.percentage).toEqual(50);
  });

  it("should prevent royalty share exceeding 100%", async () => {
    const hash = Buffer.from("hash011".padEnd(32, "0"));
    await contract.registerArtwork(
      accounts.owner,
      hash,
      "OverRevenue Art",
      "Test revenue",
      "Cultural test",
      "Tribe I",
      "Metal"
    );
    await contract.setRoyaltyShare(accounts.owner, hash, accounts.collaborator, 60);
    const result = await contract.setRoyaltyShare(
      accounts.owner,
      hash,
      accounts.nonOwner,
      50
    );
    expect(result).toEqual(Cl.error(Cl.uint(10)));
  });

  it("should verify ownership correctly", async () => {
    const hash = Buffer.from("hash012".padEnd(32, "0"));
    await contract.registerArtwork(
      accounts.owner,
      hash,
      "Verify Art",
      "Ownership test",
      "Cultural ownership",
      "Tribe J",
      "Canvas"
    );
    const result = await contract.verifyOwnership(hash, accounts.owner);
    expect(result).toEqual(Cl.ok(Cl.bool(true)));

    const wrongOwner = await contract.verifyOwnership(hash, accounts.nonOwner);
    expect(wrongOwner).toEqual(Cl.error(Cl.uint(2)));
  });
});