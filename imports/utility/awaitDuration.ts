export async function ms(duration: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, duration));
}
