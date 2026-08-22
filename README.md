About Everpix
-------------

Everpix was started in 2011 with the goal of solving the Photo Mess, an increasingly real pain point in people's life photo collections, through ambitious engineering and user experience. Our startup was angel and VC funded with $2.3M raised over its lifetime.

After 2 years of research and product development, and although having a very enthusiastic user base of early adopters combined with strong PR momentum, we didn't succeed in raising our Series A in the highly competitive VC funding market. Unable to continue operating our business, we had to announce our upcoming shutdown on November 5th, 2013.

High-Level Metrics
------------------

At the time of its shutdown announcement, the Everpix platform had 50,000 signed up users (including 7,000 subscribers) with 400 millions photos imported, while generating subscription sales of $40,000 / month during the last 3 months (i.e. enough money to cover variable costs, but not the fixed costs of the business).

The following high-level metrics are from September 2012, when we started selling subscriptions, to October 2013, the last month before our shutdown announcement:

![Users](https://raw.github.com/everpix/Everpix-Intelligence/master/_graphs/users.png)

![Photos](https://raw.github.com/everpix/Everpix-Intelligence/master/_graphs/photos.png)

![Subscribers](https://raw.github.com/everpix/Everpix-Intelligence/master/_graphs/subscribers.png)

![Sales](https://raw.github.com/everpix/Everpix-Intelligence/master/_graphs/sales.png)

![AWS](https://raw.github.com/everpix/Everpix-Intelligence/master/_graphs/aws.png)

![Retention](https://raw.github.com/everpix/Everpix-Intelligence/master/_graphs/retention.png)

*Retained users: users who used the Web, iOS, Mac, Windows Everpix apps or opened a Flashback email.*

Live Dashboard
--------------

This repo doubles as a [GestaltBI](https://github.com/GestaltBI) config repo. The client renders it straight from GitHub over jsDelivr — no build, no backend:

> https://gestaltbi.github.io/gestaltbi-core/gh/sirmmo/everpix-intelligence

Pin a commit, tag or branch by appending a ref:

> https://gestaltbi.github.io/gestaltbi-core/gh/sirmmo/everpix-intelligence/<ref>

### The config bundle

Six files at the repo root drive it. All six are generated — do not hand-edit them:

```sh
node tools/build-gestaltbi-config.mjs
```

| File | What it holds |
|------|---------------|
| `data.csv` | 14 monthly rows, Sep 2012 – Oct 2013, built from the KPI series in `Internal Metrics/` and `External Metrics/` |
| `mapping.json` | Maps the human CSV headers onto canonical codes (`Month` → `uatu:date`, `AWS Cost` → `everpix:aws_cost`, …) |
| `structure.json` | Column types, tags and aggregation rules |
| `processing.json` | The process graph: format → filter → derive margins → aggregate by month → cumulate |
| `modes.json` | The analysis modes the sidebar offers |
| `it.json` | Column labels |

### What the dashboard shows

The monthly grain carries the whole business: cash sales against revenue recognized on an accrual basis, AWS production cost, gross margin on both bases, the deferred-revenue balance, users, subscribers, storage under management, conversion and retention rates, website traffic and press volume.

The two bases are the point. Everpix sold annual plans — 71% of all subscriptions — so cash landed a year ahead of the service it paid for. In October 2013 the cash margin over AWS reads **+$10,629** and the accrual margin reads **-$4,648**. Recognized revenue never covered AWS in any of the thirteen measured months, and the deferred-revenue balance had reached **$126,681** by the shutdown announcement.

### Notes

* **Only `long` and `point` modes are exposed.** The synchronic and change-force modes rank or decompose across non-time dimensions — customer, product, region — which a monthly platform time-series does not have. Map views render empty: there is no geography in this dataset.
* **Numbers use a comma decimal separator and no thousands separator.** The client parses cells with an Italian reader, so `24918,25` is correct and `24918.25` would be read as 2491825.
* September 2012 has no AWS figure, so its margins are blank rather than equal to revenue.

Complete Dataset
----------------

Building a startup is about taking on a challenge and working countless hours on solving it. Most startups do not make it but rarely do they reveal the story behind, leaving their users often frustrated. Because we wanted the Everpix community to understand some of the dynamics in the startup world and why we had to come to such a painful ending, we worked closely with a reporter from The Verge who chronicled our last couple weeks. The [resulting article](http://www.theverge.com/2013/11/5/5039216/everpix-life-and-death-inside-the-worlds-best-photo-startup) generated extensive coverage and also some healthy discussions around some of our high-level metrics and financials. There was a lot more internal data we wanted to share but it wasn't the right time or place.

With the Everpix shutdown behind us, we had the chance to put together a significant dataset of hundreds of files covering all aspects of our business. We hope this rare and uncensored inside look at the internals of a startup will benefit the startup community.

Here are some example of common startup questions this dataset helps answering:

* What are investment terms for consecutive convertible notes and an equity seed round? What does the end cap table look like? (see [here](Financials.md))
* How does a Silicon Valley startup spend its raised money during 2 years? (see [here](Financials.md))
* What does a VC pitch deck look like? (see [here](Presentation%20Slides))
* What kinds of reasons do VCs give when they pass? (see [here](Anonymized%20VC%20Feedback.md))
* What are the open rate and click rate of transactional and marketing emails? (see [here](Internal%20Metrics/Sendgrid%20(Emails%20to%20Everpix%20Users).csv))
* What web traffic do various news websites generate? (see [here](Press%20Coverage.csv) and [here](External%20Metrics/Daily%20Website%20Traffic.csv))
* What are the conversion rate from product landing page to sign up for new visitors? (see [here](Internal%20Metrics/System%20Users%20%28First%20Time%20Visitors%20to%20Web%20Invites%20Ratio%20-%20Weekly%29.csv))
* How fast do people purchase a subscription after signing up to a freemium service? (see [here](Internal%20Metrics/Latencies%20%28Monthly%20Subscription%20Latency%20in%20Days%20-%20Since%20March%201st%29.csv) and [here](Internal%20Metrics/Latencies%20%28Yearly%20Subscription%20Latency%20in%20Days%20-%20Since%20March%201st%29.csv))
* Which countries have higher suscription rates? (see [here](Internal%20Metrics/User%20Countries%20%28Free%20Users%20Countries%29.csv) and [here](Internal%20Metrics/User%20Countries%20(Subscribed%20Users%20Countries).csv))
* What frustrates people the most abour their photo collection? (see [here](Google%20Consumer%20Surveys/What%20frustrates%20you%20the%20most%20about%20your%20photo%20collection.pdf))
* Do people actually edit their digital photos? (see [here](Google%20Consumer%20Surveys/Do%20you%20regularly%20edit%20your%20photos.pdf))
* What would it take to acquire customers through online ads in such a business? (see [here](Online%20Paid%20Customer%20Acquisition%20Test%20Results.pdf))
* How much price sensitive are consumers for such online services i.e. what's the price elasticity? (see [here](Investor%20Reports/2012-11.md))

The dataset is organized as follow:

* **[Anonymized VC Feedback.md](Anonymized%20VC%20Feedback.md):** Unedited feedback from VCs who passed on Everpix
* **[External Metrics](External%20Metrics):** Raw metrics retrieved from external systems like Google Analytics or AWS billing
* **[Financials.md](Financials.md):** High-level financials with fundraising and final P&L
* **[Internal Metrics](Internal%20Metrics):** Raw and computed metrics from our service from photos imported to subscription sales
* **[Investor Reports](Investor%20Reports):** Monthly investor reports detailing the progress, strategy and ups and downs of Everpix from the inside
* **[Online Paid Customer Acquisition Test Results.pdf](Online%20Paid%20Customer%20Acquisition%20Test%20Results.pdf):** Results from early test ad campaigns for paid customer acquisition in Summer 2013
* **[Presentation Slides](Presentation%20Slides):** The slides used to introduce Everpix to press and investors along with the latest version of our more extensive VC pitch deck
* **[Press Coverage.csv](Press%20Coverage.csv):** List of press articles covering Everpix
* **[Product Videos](Product%20Videos):** Everpix presentation videos made during the product life
* **[Public Feedback](Public%20Feedback):** Everpix user reviews from Apple & Google app stores and tweets following the shutdown announcement
* **[Google Consumer Surveys](Google%20Consumer%20Surveys):** Exclusive consumer insight research about people and their photos done with [Google Consumer Surveys](http://www.google.com/insights/consumersurveys/home)
* **[Timeline & Numbers.md](Timeline%20%26%20Numbers.md):** Everpix product timeline and numbers

The metrics in the dataset were "frozen" as of November 6th, 2013 (the day following the announcement of Everpix's shutdown) and represent more than 90% of all available Everpix metrics. Only metrics covered by NDAs with partners or metrics exposing identifiable Everpix users information have been omitted.

*To maximize reusability, metrics are formatted as [CSV files](https://en.wikipedia.org/wiki/Comma-separated_values) (using UTF-8 text encoding) and with the first row being the column names.*
