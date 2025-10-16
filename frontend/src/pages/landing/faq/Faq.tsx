import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";
import { TextAnimate } from "@/components/ui/text-animate";
import Scroller from "../Scroller/Scroller";

const Faq = () => {
    return (
        <section
            id="faq"
            className="min-h-screen bg-[#121212] text-white border-t-4 border-[#2a2a2a] flex flex-col items-center overflow-x-hidden"
        >
            <div className="w-full flex-shrink-0 border-t-4 border-[#2a2a2a]">
            </div>
            <div className="flex flex-col items-center justify-center w-full flex-grow pb-10 sm:pb-16 px-4 sm:px-8 text-center">
                <h2 className="text-5xl sm:text-6xl font-black uppercase text-center mb-16 text-white leading-tight">
                    <TextAnimate animation="blurInUp" by="word" once>
                        FREQUENTLY ASKED
                    </TextAnimate>{" "}
                    <span className="text-[#00A2FF]">
                        <TextAnimate animation="blurInUp" by="word" once>
                            QUESTIONS
                        </TextAnimate>
                    </span>
                </h2>

                <div className="w-full max-w-4xl text-left">
                    <Accordion type="single" collapsible className="space-y-6">
                        {[
                            {
                                id: "item-1",
                                question: "What is StakED?",
                                answer:
                                    "StakED is a platform where students can stake on their own academic or skill performance, and others can back them based on confidence in their success.",
                            },
                            {
                                id: "item-2",
                                question: "How does staking on performance work?",
                                answer:
                                    "You stake tokens to show confidence in a student's upcoming results. When the student performs well, both the staker and the student earn rewards.",
                            },
                            {
                                id: "item-3",
                                question: "Do I need crypto to participate?",
                                answer:
                                    "You'll need a wallet like MetaMask to stake or earn rewards. However, you can still explore and view performance markets without connecting your wallet.",
                            },
                            {
                                id: "item-4",
                                question: "Can students also stake on themselves?",
                                answer:
                                    "Absolutely. Students can stake on their own confidence to show commitment and unlock higher rewards when they achieve their goals.",
                            },
                        ].map((faq, index) => (
                            <motion.div
                                key={faq.id}
                                initial={{ opacity: 0, y: 100 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.2 }}
                                viewport={{ once: true }}
                            >
                                <AccordionItem value={faq.id}>
                                    <div className="border-4 border-[#555555] bg-[#1e1e1e] rounded-lg text-left shadow-[6px_6px_0px_#2a2a2a] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                                        <AccordionTrigger className="text-lg sm:text-xl font-bold px-6 py-4 text-[#fffdfd] transition-colors">
                                            {faq.question}
                                        </AccordionTrigger>
                                        <AccordionContent className="px-6 py-4 text-base sm:text-lg font-medium text-black">
                                            {faq.answer}
                                        </AccordionContent>
                                    </div>
                                </AccordionItem>
                            </motion.div>
                        ))}
                    </Accordion>
                </div>
            </div>


            <Scroller />

        </section>
    );
};

export default Faq;
