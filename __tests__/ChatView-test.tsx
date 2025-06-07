import ChatView from '@/components/ChatView';
import { fireEvent, render } from '@testing-library/react-native';

describe('<ChatView />', () => {
  test('renders welcome message for user Vishal', () => {
    const { getByText } = render(<ChatView />);
    expect(getByText('How can I help you, vishal?')).toBeTruthy();
  });

  test('renders all four suggestion buttons', () => {
    const { getByText } = render(<ChatView />);
    expect(getByText('Create')).toBeTruthy();
    expect(getByText('Explore')).toBeTruthy();
    expect(getByText('Code')).toBeTruthy();
    expect(getByText('Learn')).toBeTruthy();
  });

  test('renders suggested questions', () => {
    const { getByText } = render(<ChatView />);
    expect(getByText('How does AI work?')).toBeTruthy();
    expect(getByText('Are black holes real?')).toBeTruthy();
    expect(getByText("How many Rs are in the word 'strawberry'?")).toBeTruthy();
    expect(getByText('What is the meaning of life?')).toBeTruthy();
  });
  test('renders top bar with icons', () => {
    const { getByTestId } = render(<ChatView />);
    expect(getByTestId('search-button')).toBeTruthy();
    expect(getByTestId('add-button')).toBeTruthy();
    expect(getByTestId('share-button')).toBeTruthy();
    expect(getByTestId('star-button')).toBeTruthy();
    expect(getByTestId('menu-button')).toBeTruthy();
    expect(getByTestId('profile-button')).toBeTruthy();
  });
  test('renders bottom input area', () => {
    const { getByPlaceholderText, getByText, getByTestId } = render(<ChatView />);
    expect(getByPlaceholderText('Type your message here...')).toBeTruthy();
    expect(getByText('Gemini 2.5 Flash')).toBeTruthy();
    expect(getByTestId('search-input-button')).toBeTruthy();
    expect(getByTestId('send-button')).toBeTruthy();
  });

  test('can type in input field', () => {
    const { getByPlaceholderText } = render(<ChatView />);
    const input = getByPlaceholderText('Type your message here...');
    
    fireEvent.changeText(input, 'Hello AI!');
    expect(input.props.value).toBe('Hello AI!');
  });

  test('can press suggestion buttons', () => {
    const { getByText } = render(<ChatView />);
    const createButton = getByText('Create');
    
    fireEvent.press(createButton);
    // Should handle button press (we'll implement this functionality later)
  });

  test('can press suggested questions', () => {
    const { getByText } = render(<ChatView />);
    const question = getByText('How does AI work?');
    
    fireEvent.press(question);
    // Should handle question selection (we'll implement this functionality later)
  });

  test('send button is pressable', () => {
    const { getByTestId } = render(<ChatView />);
    const sendButton = getByTestId('send-button');
    
    fireEvent.press(sendButton);
    // Should handle send action (we'll implement this functionality later)
  });

  test('matches snapshot', () => {
    const tree = render(<ChatView />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
