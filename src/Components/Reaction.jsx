import Text from "../Text/Text";

export default function Reaction() {
  return (
    <>
      <Text
        text={":) :( :{ :} :O :/ :| :[ :D :<"}
        position={[0, 65, 0]}
        rotation={[0, 0, -Math.PI / 2]}
      />
    </>
  );
}
