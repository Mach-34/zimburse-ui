import { generateEmailVerifierInputsFromDKIMResult, verifyDKIMSignature } from '@zk-email/zkemail-nr/dist';
import { Sequence } from "@zk-email/zkemail-nr/dist/utils";
import { toUSDCDecimals } from ".";

const LINODE_MAX_BODY_LENGTH = 832;
const UNITED_MAX_BODY_LENGTH = 58560;

export type EmailDisplayData = {
    amount: bigint;
    date: Date;
    from: string;
    to: string;
}

const extractToAndFrom = (header: string[], from_sequence: Sequence, to_sequence: Sequence) => {

    const fromAddressStart = Number(from_sequence.index);
    const fromAddressEnd = fromAddressStart + Number(from_sequence.length);
    const toAddressStart = Number(to_sequence.index);
    const toAddressEnd = toAddressStart + Number(to_sequence.length);

    const fromBytes = header.slice(fromAddressStart, fromAddressEnd);
    const toBytes = header.slice(toAddressStart, toAddressEnd);

    const from = Buffer.from(fromBytes.map(v => Number(v))).toString('utf8');
    const to = Buffer.from(toBytes.map(v => Number(v))).toString('utf8');

    return { from, to };
}

export const extractLinodeData = async (email: Buffer): Promise<EmailDisplayData> => {
    const dkimResult = await verifyDKIMSignature(email);
    const { decoded_body, header, from_address_sequence, to_address_sequence } = generateEmailVerifierInputsFromDKIMResult(dkimResult, {
        removeSoftLineBreaks: true,
        extractFrom: true,
        extractTo: true,
        maxBodyLength: LINODE_MAX_BODY_LENGTH
    });

    // extract from and to
    const { from, to } = extractToAndFrom(header.storage, from_address_sequence as Sequence, to_address_sequence as Sequence);

    const body = Buffer.from(decoded_body!.storage.map(v => Number(v))).toString('utf8');

    // extract amount
    const amountPrefixString = "This is your receipt of payment against your credit card in the amount of";
    const amountStartIndex = body.indexOf(amountPrefixString);
    const amountDecimalIndex = body.indexOf('.', amountStartIndex + amountPrefixString.length);
    const dollarSignIndex = body.lastIndexOf('$', amountDecimalIndex);
    const amount = toUSDCDecimals(body.slice(dollarSignIndex + 1, amountDecimalIndex + 3));

    // extract date
    const deserialzedHeader = Buffer.from(header.storage.map(v => Number(v))).toString('utf8');
    const dateIndex = deserialzedHeader.indexOf('date:');
    const linebreak = deserialzedHeader.indexOf('\r\n', dateIndex);
    const date = new Date(deserialzedHeader.slice(dateIndex + 5, linebreak));

    return { amount, date, from, to }
}

export const extractUnitedData = async (email: Buffer): Promise<EmailDisplayData> => {
    const dkimResult = await verifyDKIMSignature(email);



    const { decoded_body, header, from_address_sequence, to_address_sequence } = generateEmailVerifierInputsFromDKIMResult(dkimResult, {
        removeSoftLineBreaks: true,
        extractFrom: true,
        extractTo: true,
        maxBodyLength: UNITED_MAX_BODY_LENGTH
    });

    const dkimRes = generateEmailVerifierInputsFromDKIMResult(dkimResult, {
        removeSoftLineBreaks: true,
        extractFrom: true,
        extractTo: true,
        maxBodyLength: UNITED_MAX_BODY_LENGTH
    });

    // extract from and to
    const { from, to } = extractToAndFrom(header.storage, from_address_sequence as Sequence, to_address_sequence as Sequence);

    const body = Buffer.from(decoded_body!.storage.map(v => Number(v))).toString('utf8');


    // extract amount
    const totalIndex = body.indexOf('Total:');
    const amountEnd = body.indexOf(' USD', totalIndex);
    const amountStart = body.lastIndexOf('>', amountEnd);
    const amount = toUSDCDecimals(body.slice(amountStart + 1, amountEnd));

    // extract date
    const bagDimensionIndex = body.indexOf('2nd bag weight and dimensions');
    const arrivalIndex = body.indexOf(')<br/>', bagDimensionIndex);
    const dateEndIndex = body.lastIndexOf('<br/>', arrivalIndex)
    const dateStartIndex = body.lastIndexOf('>', dateEndIndex);
    const date = new Date(body.slice(dateStartIndex + 1, dateEndIndex));
    return { amount, date, from, to };
}