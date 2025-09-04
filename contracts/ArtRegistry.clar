(define-constant ERR-ALREADY-REGISTERED u1)
(define-constant ERR-NOT-OWNER u2)
(define-constant ERR-INVALID-HASH u3)
(define-constant ERR-INVALID-PARAM u4)
(define-constant ERR-NOT-FOUND u5)
(define-constant ERR-INVALID-VERSION u6)
(define-constant ERR-MAX-TAGS-REACHED u7)
(define-constant ERR-NOT-COLLABORATOR u8)
(define-constant ERR-INVALID-PERCENTAGE u9)
(define-constant ERR-TOTAL-PERCENTAGE-EXCEEDS-100 u10)
(define-constant MAX-TAGS u10)
(define-constant MAX-COLLABORATORS u20)
(define-constant MAX-VERSIONS u50)

;; Data Maps
(define-map artwork-registry
  { art-hash: (buff 32) }
  {
    owner: principal,
    timestamp: uint,
    title: (string-utf8 200),
    description: (string-utf8 1000),
    cultural-significance: (string-utf8 2000),
    origin: (string-utf8 100),
    medium: (string-utf8 100)
  }
)

(define-map artwork-versions
  { art-hash: (buff 32), version: uint }
  {
    updated-hash: (buff 32),
    update-notes: (string-utf8 500),
    timestamp: uint,
    updater: principal
  }
)

(define-map artwork-categories
  { art-hash: (buff 32) }
  {
    primary-category: (string-utf8 100),
    tags: (list 10 (string-utf8 50))
  }
)

(define-map artwork-collaborators
  { art-hash: (buff 32), collaborator: principal }
  {
    role: (string-utf8 100),
    permissions: (list 5 (string-utf8 50)),
    added-at: uint
  }
)

(define-map artwork-status
  { art-hash: (buff 32) }
  {
    status: (string-utf8 50),
    visibility: bool,
    last-updated: uint
  }
)

(define-map royalty-shares
  { art-hash: (buff 32), participant: principal }
  {
    percentage: uint,
    total-received: uint
  }
)

(define-map total-royalty-shares
  { art-hash: (buff 32) }
  uint
)

;; Public Functions
(define-public (register-artwork 
  (art-hash (buff 32))
  (title (string-utf8 200))
  (description (string-utf8 1000))
  (cultural-significance (string-utf8 2000))
  (origin (string-utf8 100))
  (medium (string-utf8 100)))
  (let
    ((existing (map-get? artwork-registry { art-hash: art-hash })))
    (try! (validate-hash art-hash))
    (asserts! (is-none existing) (err ERR-ALREADY-REGISTERED))
    (asserts! (and (> (len title) u0) (> (len description) u0)) (err ERR-INVALID-PARAM))
    (map-set artwork-registry
      { art-hash: art-hash }
      {
        owner: tx-sender,
        timestamp: block-height,
        title: title,
        description: description,
        cultural-significance: cultural-significance,
        origin: origin,
        medium: medium
      }
    )
    (map-set artwork-status
      { art-hash: art-hash }
      {
        status: u"pending-authentication",
        visibility: false,
        last-updated: block-height
      }
    )
    (map-set total-royalty-shares { art-hash: art-hash } u0)
    (ok true)
  )
)

(define-public (transfer-ownership (art-hash (buff 32)) (new-owner principal))
  (let
    ((registration (try! (get-artwork art-hash))))
    (asserts! (is-eq (get owner registration) tx-sender) (err ERR-NOT-OWNER))
    (map-set artwork-registry
      { art-hash: art-hash }
      (merge registration { owner: new-owner })
    )
    (ok true)
  )
)

(define-public (add-version 
  (art-hash (buff 32))
  (new-hash (buff 32))
  (version uint)
  (notes (string-utf8 500)))
  (let
    ((registration (try! (get-artwork art-hash)))
     (existing-version (map-get? artwork-versions { art-hash: art-hash, version: version })))
    (try! (validate-hash new-hash))
    (asserts! (is-eq (get owner registration) tx-sender) (err ERR-NOT-OWNER))
    (asserts! (is-none existing-version) (err ERR-ALREADY-REGISTERED))
    (asserts! (<= version MAX-VERSIONS) (err ERR-INVALID-VERSION))
    (map-set artwork-versions
      { art-hash: art-hash, version: version }
      {
        updated-hash: new-hash,
        update-notes: notes,
        timestamp: block-height,
        updater: tx-sender
      }
    )
    (ok true)
  )
)

(define-public (add-category 
  (art-hash (buff 32))
  (category (string-utf8 100))
  (tags (list 10 (string-utf8 50))))
  (let
    ((registration (try! (get-artwork art-hash))))
    (asserts! (is-eq (get owner registration) tx-sender) (err ERR-NOT-OWNER))
    (asserts! (<= (len tags) MAX-TAGS) (err ERR-MAX-TAGS-REACHED))
    (map-set artwork-categories
      { art-hash: art-hash }
      { primary-category: category, tags: tags }
    )
    (ok true)
  )
)

(define-public (add-collaborator 
  (art-hash (buff 32))
  (collaborator principal)
  (role (string-utf8 100))
  (permissions (list 5 (string-utf8 50))))
  (let
    ((registration (try! (get-artwork art-hash)))
     (existing-collab (map-get? artwork-collaborators { art-hash: art-hash, collaborator: collaborator })))
    (asserts! (is-eq (get owner registration) tx-sender) (err ERR-NOT-OWNER))
    (asserts! (is-none existing-collab) (err ERR-ALREADY-REGISTERED))
    (map-set artwork-collaborators
      { art-hash: art-hash, collaborator: collaborator }
      {
        role: role,
        permissions: permissions,
        added-at: block-height
      }
    )
    (ok true)
  )
)

(define-public (update-status 
  (art-hash (buff 32))
  (new-status (string-utf8 50))
  (new-visibility bool))
  (let
    ((registration (try! (get-artwork art-hash)))
     (current-status (try! (get-status-internal art-hash))))
    (asserts! (is-eq (get owner registration) tx-sender) (err ERR-NOT-OWNER))
    (map-set artwork-status
      { art-hash: art-hash }
      {
        status: new-status,
        visibility: new-visibility,
        last-updated: block-height
      }
    )
    (ok true)
  )
)

(define-public (set-royalty-share 
  (art-hash (buff 32))
  (participant principal)
  (percentage uint))
  (let
    ((registration (try! (get-artwork art-hash)))
     (current-total (default-to u0 (map-get? total-royalty-shares { art-hash: art-hash }))))
    (asserts! (is-eq (get owner registration) tx-sender) (err ERR-NOT-OWNER))
    (asserts! (and (> percentage u0) (<= percentage u100)) (err ERR-INVALID-PERCENTAGE))
    (let
      ((new-total (+ current-total percentage)))
      (asserts! (<= new-total u100) (err ERR-TOTAL-PERCENTAGE-EXCEEDS-100))
      (map-set royalty-shares
        { art-hash: art-hash, participant: participant }
        { percentage: percentage, total-received: u0 }
      )
      (map-set total-royalty-shares { art-hash: art-hash } new-total)
      (ok true)
    )
  )
)

(define-public (distribute-royalties (art-hash (buff 32)) (amount uint))
  (let
    ((registration (try! (get-artwork art-hash))))
    (asserts! (is-eq (get owner registration) tx-sender) (err ERR-NOT-OWNER))
    ;; In real implementation, iterate over royalty-shares and perform STX transfers
    ;; Here, we simulate by updating total-received for the owner
    (map-set royalty-shares
      { art-hash: art-hash, participant: tx-sender }
      (let ((current (default-to { percentage: u0, total-received: u0 } 
                     (map-get? royalty-shares { art-hash: art-hash, participant: tx-sender }))))
        (merge current { total-received: (+ (get total-received current) amount) })
      )
    )
    (ok true)
  )
)

;; Read-Only Functions
(define-read-only (get-artwork-details (art-hash (buff 32)))
  (map-get? artwork-registry { art-hash: art-hash })
)

(define-read-only (get-version-details (art-hash (buff 32)) (version uint))
  (map-get? artwork-versions { art-hash: art-hash, version: version })
)

(define-read-only (get-categories (art-hash (buff 32)))
  (map-get? artwork-categories { art-hash: art-hash })
)

(define-read-only (get-collaborator (art-hash (buff 32)) (collaborator principal))
  (map-get? artwork-collaborators { art-hash: art-hash, collaborator: collaborator })
)

(define-read-only (get-status (art-hash (buff 32)))
  (map-get? artwork-status { art-hash: art-hash })
)

(define-read-only (get-royalty-share (art-hash (buff 32)) (participant principal))
  (map-get? royalty-shares { art-hash: art-hash, participant: participant })
)

(define-read-only (verify-ownership (art-hash (buff 32)) (claimed-owner principal))
  (match (map-get? artwork-registry { art-hash: art-hash })
    registration
    (if (is-eq (get owner registration) claimed-owner)
      (ok true)
      (err ERR-NOT-OWNER)
    )
    (err ERR-NOT-FOUND)
  )
)

(define-read-only (has-permission (art-hash (buff 32)) (collaborator principal) (permission (string-utf8 50)))
  (match (map-get? artwork-collaborators { art-hash: art-hash, collaborator: collaborator })
    collab
    (ok (is-some (index-of? (get permissions collab) permission)))
    (err ERR-NOT-COLLABORATOR)
  )
)

;; Private Functions
(define-private (validate-hash (hash (buff 32)))
  (if (is-eq (len hash) u32)
    (ok true)
    (err ERR-INVALID-HASH)
  )
)

(define-private (get-artwork (art-hash (buff 32)))
  (match (map-get? artwork-registry { art-hash: art-hash })
    registration (ok registration)
    (err ERR-NOT-FOUND)
  )
)

(define-private (get-status-internal (art-hash (buff 32)))
  (match (map-get? artwork-status { art-hash: art-hash })
    status (ok status)
    (err ERR-NOT-FOUND)
  )
)