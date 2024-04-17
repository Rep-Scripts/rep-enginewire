import { AnimatePresence, motion, Variants } from 'framer-motion';

type ScaleFadeProps = {
  visible: boolean;
  children: React.ReactNode;
  onExitComplete?: () => void;
  initialStyles?: any;
  transitionDuration?: number;
};

const ScaleFade: React.FC<ScaleFadeProps> = ({
  visible,
  children,
  onExitComplete,
  initialStyles = { opacity: 0, scale: 0.8 },
  transitionDuration = 0.3,
}) => {
  const variants: Variants = {
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: transitionDuration,
        ease: 'easeOut',
      },
    },
    hidden: {
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: transitionDuration,
        ease: 'easeOut',
      },
    },
  };

  return (
    <AnimatePresence onExitComplete={onExitComplete}>
      {visible && (
        <motion.div initial="hidden" animate="visible" exit="hidden" variants={variants} style={{ overflow: 'hidden' }}>
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ScaleFade;
