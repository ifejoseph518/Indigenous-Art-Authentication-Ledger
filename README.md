# 🌿 Indigenous Art Authentication Ledger

Welcome to a revolutionary blockchain platform designed to authenticate and protect indigenous art! This project uses the Stacks blockchain and Clarity smart contracts to create an immutable ledger that verifies the authenticity of indigenous artworks, tracks their provenance, and safeguards against forgeries in global markets. By empowering indigenous artists and communities, it ensures fair trade, preserves cultural heritage, and prevents exploitation.

## ✨ Features

🔒 Immutable registration of art pieces with unique hashes and metadata  
📜 Provenance tracking for ownership history and transfers  
✅ Multi-party authentication by artists, experts, and communities  
💰 Royalty distribution for ongoing artist support  
🛒 Integrated marketplace for verified sales  
⚖️ Dispute resolution mechanism for forgery claims  
🌍 Global verification accessible to buyers and galleries  
🚫 Anti-forgery checks to block duplicates or fakes  
📊 Analytics for art valuation and market insights  
🤝 Community governance for platform rules

## 🛠 How It Works

This project leverages 8 interconnected Clarity smart contracts to build a robust ecosystem. Each contract handles a specific aspect, ensuring modularity, security, and scalability on the Stacks blockchain.

### Core Smart Contracts
1. **UserRegistry.clar**: Registers users (artists, buyers, authenticators, communities) with verified identities and roles.  
2. **ArtRegistry.clar**: Allows artists to register artworks by submitting a SHA-256 hash of the piece, along with title, description, cultural significance, and origin details. Prevents duplicate registrations.  
3. **ProvenanceTracker.clar**: Logs the full history of an artwork, including creation, transfers, and authentications, creating an immutable chain of custody.  
4. **AuthenticationContract.clar**: Enables multi-signature approvals from artists, cultural experts, and indigenous communities to certify authenticity.  
5. **OwnershipTransfer.clar**: Handles secure transfers of ownership, updating provenance and triggering royalty payments.  
6. **RoyaltySplitter.clar**: Automatically distributes royalties (e.g., 10% of sales) to artists and community funds using predefined splits.  
7. **Marketplace.clar**: Facilitates buying and selling of verified artworks, with built-in escrow for trustless transactions.  
8. **DisputeResolution.clar**: Manages claims of forgery or disputes, allowing evidence submission and community-voted resolutions.

**For Artists and Communities**  
- Verify your identity via UserRegistry.  
- Generate a hash of your artwork (e.g., photo or digital scan).  
- Call register-art in ArtRegistry with the hash, metadata, and request authentications.  
- Once approved via AuthenticationContract, your piece is listed as authentic.  
- Sell or transfer via Marketplace or OwnershipTransfer, earning royalties automatically.

**For Buyers and Verifiers**  
- Search for artworks using get-art-details in ArtRegistry.  
- Verify provenance with check-provenance in ProvenanceTracker.  
- Confirm authenticity via verify-authentication.  
- If suspicious, initiate a dispute in DisputeResolution for review.  

**For Global Markets**  
- Galleries and buyers can instantly check an artwork's ledger to avoid forgeries.  
- The system promotes ethical trading by ensuring proceeds benefit indigenous creators.

This setup solves the real-world problem of art forgeries eroding trust and economic value in indigenous art markets, fostering transparency and cultural preservation!