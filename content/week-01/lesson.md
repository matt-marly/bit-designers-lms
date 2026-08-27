# Why Bitcoin Matters

> BitDesigners · Core Materials · ≈20 min read · Pairs with Lesson 1

## 1. Start With Money, Not Bitcoin

Every Bitcoin explanation that starts with "blockchain" loses designers in ten minutes. So we won't. We'll start with a question you already have strong opinions about, whether you know it or not:

**What is money actually for?**

Money does three jobs:

1. **Medium of exchange** — you can trade it for things.
2. **Unit of account** — you can price things in it.
3. **Store of value** — you can hold it and it keeps its worth over time.

Most money you've used does the first two jobs reasonably well. It's the third job — storing value — where the money most of us were born into quietly fails. And that failure is not evenly distributed across the world.

Roughly 1.2 billion people live under double- or triple-digit inflation, and only a small minority of the world's population is born into a reserve currency like the dollar or euro. The rest — the overwhelming majority — are born into currencies that are weaker, more volatile, and more tightly controlled. If you are reading this from Lagos, Nairobi, Accra, or Kampala, you don't need that statistic explained. You've lived it.

## 2. The African Monetary Reality

This section is the heart of the lesson. Bitcoin design programs elsewhere teach "why Bitcoin" as theory. For us it's a description of the environment our users already live in. Four forces shape money for the African user:

### 2.1 Inflation eats savings

Nigeria's inflation ran above 30% in 2024 before easing to the mid-teens — around 16% in mid-2026 — with food inflation running even higher. The naira lost roughly 43% of its value against the dollar in 2024 alone, ranking among the region's worst-performing currencies. A person who saved ₦1,000,000 in cash in early 2023 watched its purchasing power collapse through no fault of their own.

**Design translation:** Your users have a learned distrust of holding local currency. "Savings" for many people means dollars under a mattress, goods, livestock, or airtime — anything but a naira balance. When a wallet shows a balance, the question "in what unit, and can I trust that unit?" is emotional, not academic.

### 2.2 Currency controls limit what your money can do

Across the continent, central banks ration foreign exchange. Official rates diverge from street rates. Businesses can't reliably pay foreign suppliers; individuals can't reliably pay for foreign services or receive international payments. Your money works — until it needs to cross a border, and then it needs permission.

**Design translation:** African users are experts at workarounds — parallel markets, P2P trades, gift cards, agents. They will bring workaround mental models into your product. They also deeply understand the difference between "my money" and "money the system lets me use."

### 2.3 Remittances are a lifeline with a toll gate

Sub-Saharan Africa receives tens of billions of dollars in remittances every year — Nigeria alone received about $19.5 billion in 2023, roughly a third of the region's total. Yet Sub-Saharan Africa is consistently the most expensive region in the world to send money to, with average fees around 8% of the amount sent. Sending $200 home can cost $15–16 before it arrives.

**Design translation:** For much of the world, "cheaper, faster money movement" is a mild convenience. For your users, a fee difference of a few percent is groceries. Fee transparency is not a nice-to-have in African fintech — it's the whole game.

### 2.4 Mobile money proved the appetite and revealed the ceiling

M-Pesa, MTN MoMo, OPay, Wave and others proved something the rest of the world doubted: Africans will adopt digital money at massive scale when it works on the phones they have and the networks they have. Mobile money is the greatest fintech success story on Earth, and it happened here.

But mobile money has limits baked in. It's **custodial** (the operator holds your money and can freeze it), **national** (it mostly stops at borders), fee-laden, and **permissioned** (accounts require registration and can be shut down — as protest movements across the continent have discovered).

**Design translation:** Mobile money is the mental model your users will bring to any wallet you design. Agent networks, USSD codes, PINs, SMS confirmations, "sending to a phone number" — this is what money-on-a-phone means to hundreds of millions of people. Bitcoin products that ignore this model confuse users; products that build on it (like Machankura's USSD Bitcoin, which we'll meet in Lesson 2) meet users where they are.

## 3. Why Bitcoin Was Created

In 2008, in the middle of a global financial crisis caused by the institutions people were forced to trust, a pseudonymous person or group called Satoshi Nakamoto published a nine-page paper: *"Bitcoin: A Peer-to-Peer Electronic Cash System."*

The idea in one sentence: **electronic money that works without a trusted middleman.**

Before Bitcoin, every digital payment required an institution in the middle — a bank, a card network, a mobile money operator — because digital things can be copied, and someone had to keep the ledger honest. Satoshi's breakthrough was a way for thousands of strangers' computers to maintain one shared ledger that no single party controls, where nobody can spend the same money twice, and where the rules (including the fixed supply of 21 million bitcoin) can't be quietly changed by whoever is in charge, because nobody is in charge.

Bitcoin launched in January 2009. It has run continuously ever since — no CEO, no headquarters, no customer support line, no off switch. That last sentence describes both its greatest strength and, as you'll spend eight weeks learning, its greatest design challenge.

One clarification that saves a lot of confusion: **Bitcoin** (capital B) is the network and protocol, the system. **bitcoin** (small b, or "sats") is the money that moves on it. This program is about Bitcoin the system and the products built on it. It is *not* about price speculation, trading, or "crypto" broadly. Our curation rule for the whole program: **no price content, ever.**

## 4. The Five Principles and What They Mean for Design

These five properties are why Bitcoin matters, and each one creates design work that doesn't exist in ordinary fintech. This table is the bridge between Track 1 (understanding Bitcoin) and Track 2 (designing for it). We will return to it in every lesson.

### 4.1 Decentralization

No single party controls the network.

No company can freeze the network, reverse your payment, or change the rules on you. But it also means: no company can help you. There is no support line to call, no "forgot password" flow backed by a database admin.

**Design consequence:** The product must do the educating, protecting, and error-prevention that a support department does elsewhere. **The interface is the institution.**

### 4.2 Self-custody

You can hold your own money directly, with no custodian.

With a non-custodial wallet, your money cannot be frozen by an operator, seized by a failing institution, or lost in a platform collapse. But the keys that control your money are your responsibility — lose them, and no one can restore access.

**Design consequence:** Backup and recovery flows carry life-savings-level stakes. This is the single hardest UX problem in Bitcoin, and it's Lesson 4's entire focus.

### 4.3 Permissionlessness

No one can stop you from using it.

No account application, no ID requirement at the protocol level, no minimum balance, no "your account has been suspended." A farmer with a feature phone and a developer in Berlin have the same access. For activists whose accounts have been frozen — as Nigerian protest organizers experienced in 2020, when they turned to Bitcoin after payment channels were cut off — this is the whole point.

**Design consequence:** Your onboarding cannot assume documents, bank accounts, or even smartphones. Inclusion isn't a compliance checkbox; it's the product's reason to exist.

### 4.4 Privacy

Transactions don't require identity.

Bitcoin addresses aren't names. Used carefully, Bitcoin lets people transact without broadcasting their finances to companies, data brokers, or hostile parties. Used carelessly, the public ledger can expose more than users expect — every transaction is visible forever.

**Design consequence:** Honest privacy design — helping users understand what is and isn't visible — instead of false promises of anonymity. Also a research ethics duty we'll formalize in Lesson 6: Bitcoin users are a privacy-sensitive population.

### 4.5 Security

The network protects value with mathematics, not promises.

Bitcoin's ledger has never been successfully falsified. The protocol is extraordinarily secure. Almost every loss users suffer happens at the edges — scams, phishing, bad backups, wrong addresses. In other words: **most Bitcoin losses are interface failures.**

**Design consequence:** Security UX is where designers save real money for real people. Confirmation moments, address verification, honest warnings — friction, used deliberately, is a feature. That idea anchors Lesson 3.

## 5. Why This Matters Here More Than Anywhere

Put the two halves of this lesson together:

| African monetary reality | What Bitcoin offers |
| --- | --- |
| Inflation destroys savings in local currency | A money with a fixed supply no government can print |
| Currency controls trap money inside borders | A network no authority can gate |
| Remittances lose ~8% in fees | Transfers that can cost cents (especially on Lightning) |
| Mobile money is custodial and can be frozen | Money you can hold yourself |
| Financial exclusion by documentation and geography | Access for anyone with a phone |

This is why per-capita grassroots Bitcoin adoption in African countries ranks among the highest in the world — not because of speculation, but because the problems Bitcoin was built to solve are daily life here.

And it's why you matter. The gap between Bitcoin's promise and Bitcoin's usability is a design gap. Most Bitcoin products are designed by developers in Europe and North America for users like themselves — strong phones, cheap data, stable currencies as a fallback, decades of banking habits. The designer who understands both Bitcoin's principles and the African user's reality is one of the rarest and most needed people in this industry. That's the person this program exists to produce.

## 6. Glossary (Lesson 1 terms)

- **Bitcoin / bitcoin (BTC)** — Capital B: the network and protocol. Small b: the currency that moves on it.
- **Sat (satoshi)** — The smallest unit of bitcoin. 100,000,000 sats = 1 bitcoin. Most African usage is denominated in sats.
- **Fiat currency** — Government-issued money (naira, cedi, shilling, dollar) whose supply is controlled by a central bank.
- **Inflation** — The decline of a currency's purchasing power over time; prices rise as money buys less.
- **Devaluation** — A fall in a currency's value relative to other currencies.
- **Remittance** — Money sent home across borders, usually by family members working abroad.
- **Mobile money** — Phone-based money services run by telecom operators or fintechs (M-Pesa, MoMo, OPay). Custodial: the operator holds the funds.
- **Custodial / Non-custodial** — Custodial: a company holds your money for you (bank, exchange, mobile money). Non-custodial: you hold it yourself via your own keys.
- **Satoshi Nakamoto** — The pseudonymous creator(s) of Bitcoin. Identity unknown; disappeared from public activity in 2011 — which is itself part of why no one controls Bitcoin.
- **Whitepaper** — The original 2008 nine-page document describing how Bitcoin works.
- **Ledger** — A record of who owns what. Bitcoin's ledger is shared publicly across thousands of computers instead of held by one institution.
- **Peer-to-peer (P2P)** — Directly between two people, with no institution in the middle.
- **Decentralization, Self-custody, Permissionlessness, Privacy, Security** — The five principles (Section 4). Learn them; every design critique in this program will reference them.

---

*Next: Reader Part 2 — How Bitcoin Works (unlocks with Lesson 2), where these principles become transactions, keys, wallets, and blocks — and you move real sats for the first time.*
