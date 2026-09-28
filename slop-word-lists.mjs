/* @layer tooling-scripts @kind data */
const SLOP_WORDS = [
  'delve|delving|leverage|leverages|leveraging|utilize|utilizes|utilizing|facilitate|facilitates',
  'elucidate|embark|endeavor|encompass|encompasses|multifaceted|tapestry|testament|paradigm|synergy',
  'holistic|catalyze|juxtapose|realm|myriad|plethora|galvanize|epitomize|supercharge|spearhead',
  'conceptualize|robust|robustly|robustness|comprehensive|comprehensively|seamless|cutting-edge',
  'innovative|streamline|streamlined|streamlines|empower|empowers|foster|fosters|fostering',
  'elevate|elevates|pivotal|intricate|intricacies|profound|resonate|resonates|cultivate|bolster',
  'bolsters|cornerstone|game-changer|game-changing|groundbreaking|transformative|unprecedented',
  'compelling|ever-evolving|meticulous|versatile|bespoke|unwavering|vibrant|unleash|unveil',
  'captivate|revolutionize|amplify|illuminate|discern|crucial|crucially|vital|paramount|pragmatic',
  'foundational|strategic|straightforward|nuanced|nuance|showcase|showcases|showcasing|garner',
  'interplay|enduring|actionable|enhance|enhances|enhanced|enhancing|optimal|optimally',
  'utilization|functionality|functionalities|granular|granularity|battle-tested|production-ready',
  'production-grade|enterprise-grade|best-in-class|state-of-the-art|powerful|elegant|intuitive',
  'scalable|maintainable|performant|user-friendly|hassle-free|effortless|blazing|blazingly',
].join('|');

const FILLER_ADVERBS = [
  'genuinely|quietly|simply|essentially|fundamentally|importantly|ultimately|notably|arguably',
  'indeed|truly|seamlessly|meticulously|effortlessly|elegantly|gracefully|beautifully|cleanly',
  'properly|correctly|accordingly|efficiently|effectively|successfully|basically|actually',
  'clearly|obviously|certainly|definitely|absolutely|really',
].join('|');

const STOCK_PHRASES = [
  "it(?:'s| is) worth noting|it (?:is|should be) (?:important|noted|worth)(?: to note)?",
  'keep in mind|in order to|at the end of the day|the key is|dive into|deep dive',
  "here's the thing|a testament to|moving forward|going forward|as well as|in this case,",
  'this means that|this ensures|which means that|make sure to|be sure to|feel free to',
  "worth mentioning|in today's|in a world where|when it comes to|the beauty of|it's important to",
  'plays? a (?:crucial|vital|key|pivotal) role',
  'please note|note:|important:|remember to|remember that|as (?:mentioned|noted|discussed) (?:above|earlier|before)',
  'for (?:demonstration|illustration|example) purposes|in a real(?:-world)? (?:app|application|scenario|project|implementation)',
  'in production,? you|in a production (?:app|application|environment|setting)',
  'this is (?:a|just a) (?:simple|basic|minimal|naive|quick) |(?:basic|simple|minimal|naive|reference|example|sample|placeholder|mock|dummy|stub) implementation',
  'you (?:may|might|could|will) (?:want|need) to|consider (?:adding|using|implementing|wrapping)|if needed|as needed|for now',
  'should work|this should|let me know|hope this helps|happy coding|great question',
  "here(?:'s| is) (?:a|an|the) (?:simple|basic|complete|full|updated|improved|enhanced|refactored|cleaned|final|working)",
  'in summary|to summarize|in short|long story short|key (?:features|points|takeaways|benefits|highlights|differences)',
  "step \\d+:|first,? (?:we|let's)|next,? (?:we|let's)|finally,? (?:we|let's)|now,? (?:we|let's)|let's (?:start|begin|look|take|see|break)",
  'todo:? implement|implement(?:ation)? (?:goes|details) here|add your (?:logic|code|implementation) here|your (?:api key|token|code|logic) here',
  'lorem ipsum|handle (?:the )?edge cases?|edge case handling|error handling logic|business logic here|rest of (?:the )?(?:code|logic|implementation)',
  'the (?:above|following|below) (?:code|snippet|example|function|component)|as you can see|as shown (?:above|below)',
  'a (?:wide|broad) (?:range|variety) of|a (?:number|couple|handful) of|the fact that|in terms of|with respect to|on the other hand',
  'needless to say|it goes without saying|last but not least|first and foremost|each and every|any and all',
].join('|');

const CONNECTORS = [
  'Furthermore|Moreover|Additionally|Consequently|Nevertheless|That said|In other words',
  'In conclusion|Overall|Importantly|Crucially|Note that|Notably|Ultimately|Essentially|Interestingly',
  'However|Therefore|Thus|Hence|Indeed|Alternatively|Specifically|Basically|Similarly|Likewise',
  'In summary|To summarize|In short|In addition|As a result|For instance|Of course|Remember',
].join('|');

export { SLOP_WORDS, FILLER_ADVERBS, STOCK_PHRASES, CONNECTORS };
